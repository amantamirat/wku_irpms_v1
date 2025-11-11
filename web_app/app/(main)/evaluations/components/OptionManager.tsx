'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import ErrorComponent from '@/components/ErrorComponent';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OptionApi } from '../api/option.api';
import { Option } from '../models/option.model';
import { Criterion } from '../models/criterion.model';
import SaveOption from './SaveOption';


interface OptionManagerProps {
    criterion: Criterion;
}

const OptionManager = ({ criterion }: OptionManagerProps) => {
    const emptyOption: Option = {
        title: '',
        score: 0,
        criterion: criterion,
    };

    const [options, setOptions] = useState<Option[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<any>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedOption, setSelectedOption] = useState<Option>(emptyOption);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    // Initialize filters
    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    // Fetch options for this criterion
    const fetchOptions = useCallback(async () => {
        try {
            const data = await OptionApi.getOptions({ criterion: String(criterion._id) });
            setOptions(data);
        } catch (err) {
            setError(`Failed to load options: ${err}`);
        }
    }, [criterion]);

    useEffect(() => {
        if (criterion._id) fetchOptions();
    }, [criterion, fetchOptions]);

    if (error) {
        return <ErrorComponent errorMessage={error} />;
    }

    // Handle save (create/update)
    const onSaveComplete = (savedOption: Option) => {
        let _options = [...options];
        const index = _options.findIndex((o) => o._id === savedOption._id);
        if (index !== -1) {
            _options[index] = { ...savedOption };
        } else {
            _options.push({ ...savedOption });
        }
        setOptions(_options);
        hideDialogs();
    };

    // Delete option
    const deleteOption = async () => {
        const deleted = await OptionApi.deleteOption(selectedOption);
        if (deleted) {
            setOptions(options.filter((o) => o._id !== selectedOption._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedOption(emptyOption);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                label="New Option"
                icon="pi pi-plus"
                severity="success"
                className="mr-2"
                onClick={() => {
                    setSelectedOption(emptyOption);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Options for "{criterion.title}"</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilter}
                    onChange={onGlobalFilterChange}
                    placeholder="Search..."
                    className="w-full md:w-1/3"
                />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Option) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setSelectedOption(rowData);
                    setShowSaveDialog(true);
                }}
            />
            <Button
                icon="pi pi-trash"
                rounded
                severity="warning"
                className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setSelectedOption(rowData);
                    setShowDeleteDialog(true);
                }}
            />
        </>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>

            <DataTable
                ref={dt}
                value={options}
                selection={selectedOption}
                onSelectionChange={(e) => setSelectedOption(e.value as Option)}
                dataKey="_id"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="datatable-responsive"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} options"
                globalFilter={globalFilter}
                emptyMessage="No options found."
                header={header}
                scrollable
                filters={filters}
            >
                <Column selectionMode="single" headerStyle={{ width: '3em' }}/>
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                <Column field="title" header="Title" sortable />
                <Column field="score" header="Score" sortable />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
            </DataTable>

            {selectedOption && (
                <SaveOption
                    visible={showSaveDialog}
                    option={selectedOption}
                    onComplete={onSaveComplete}
                    onHide={() => setShowSaveDialog(false)}
                />
            )}

            {selectedOption && (
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    title={String(selectedOption.title)}
                    onConfirmAsync={deleteOption}
                    onHide={() => setShowDeleteDialog(false)}
                />
            )}
        </div>
    );
};

export default OptionManager;
