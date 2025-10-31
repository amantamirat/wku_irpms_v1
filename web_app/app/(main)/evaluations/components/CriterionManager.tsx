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
import { Evaluation } from '../../evaluations/models/evaluation.model';
import { CriterionApi } from '../api/criterion.api';
import { Criterion, FormType } from '../models/criterion.model';
import SaveCriterion from './SaveCriterion';

interface CriterionManagerProps {
    evaluation: Evaluation;
}

const CriterionManager = ({ evaluation }: CriterionManagerProps) => {
    const emptyCriterion: Criterion = {
        title: '',
        weight: 0,
        form_type: FormType.closed,
        evaluation: evaluation,
    };

    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedCriterion, setSelectedCriterion] = useState<Criterion>(emptyCriterion);
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

    // Fetch criteria for this evaluation
    const fetchCriteria = useCallback(async () => {
        try {
            const data = await CriterionApi.getCriteria({ evaluation: String(evaluation._id) });
            setCriteria(data);
        } catch (err) {
            setError(`Failed to load criteria: ${err}`);
        }
    }, [evaluation]);

    useEffect(() => {
        if (evaluation._id) fetchCriteria();
    }, [evaluation, fetchCriteria]);

    if (error) {
        return <ErrorComponent errorMessage={error} />;
    }

    // Handle save (create/update)
    const onSaveComplete = (savedCriterion: Criterion) => {
        let _criteria = [...criteria];
        const index = _criteria.findIndex((c) => c._id === savedCriterion._id);
        if (index !== -1) {
            _criteria[index] = { ...savedCriterion };
        } else {
            _criteria.push({ ...savedCriterion });
        }
        setCriteria(_criteria);
        hideDialogs();
    };

    // Delete criterion
    const deleteCriterion = async () => {
        const deleted = await CriterionApi.deleteCriterion(selectedCriterion);
        if (deleted) {
            setCriteria(criteria.filter((c) => c._id !== selectedCriterion._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedCriterion(emptyCriterion);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                label="New Criterion"
                icon="pi pi-plus"
                severity="success"
                className="mr-2"
                onClick={() => {
                    setSelectedCriterion(emptyCriterion);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Criteria for "{evaluation.title}"</h5>
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

    const actionBodyTemplate = (rowData: Criterion) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setSelectedCriterion(rowData);
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
                    setSelectedCriterion(rowData);
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
                value={criteria}
                selection={selectedCriterion}
                onSelectionChange={(e) => setSelectedCriterion(e.value as Criterion)}
                dataKey="_id"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="datatable-responsive"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} criteria"
                globalFilter={globalFilter}
                emptyMessage="No criteria found."
                header={header}
                scrollable
                filters={filters}
            >
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                <Column field="title" header="Title" sortable />
                <Column field="weight" header="Weight" sortable />
                <Column field="form_type" header="Form Type" sortable />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
            </DataTable>

            {selectedCriterion && (
                <SaveCriterion
                    visible={showSaveDialog}
                    criterion={selectedCriterion}
                    onComplete={onSaveComplete}
                    onHide={() => setShowSaveDialog(false)}
                />
            )}

            {selectedCriterion && (
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    selectedDataInfo={String(selectedCriterion.title)}
                    onConfirmAsync={deleteCriterion}
                    onHide={() => setShowDeleteDialog(false)}
                />
            )}
        </div>
    );
};

export default CriterionManager;
