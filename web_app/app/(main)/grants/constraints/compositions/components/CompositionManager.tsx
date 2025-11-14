'use client';
import ConfirmDialog from '@/components/ConfirmationDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CompositionApi } from '../api/composition.api';
import { Composition } from '../models/composition.model';
import { ApplicantConstraintType, Constraint, isListConstraint, isRangeConstraint } from '../../models/constraint.model';
import SaveDialog from './SaveDialog';
import ErrorComponent from '@/components/ErrorComponent';

interface CompositionManagerProps {
    constraint: Constraint;
}

const CompositionManager = ({ constraint }: CompositionManagerProps) => {

    const emptyComposition: Composition = {
        constraint: constraint,
        value: 0
    };
    const [error, setError] = useState<string | null>(null);
    const [compositions, setCompositions] = useState<Composition[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedComposition, setSelectedComposition] = useState<Composition>(emptyComposition);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };
    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    const fetchCompositions = useCallback(async () => {
        try {
            const data = await CompositionApi.getCompositions({ constraint: constraint._id });
            setCompositions(data);
        } catch (err) {
            setError(`Failed to fetch composition data ${err}`);
        }
    }, [parent]);

    useEffect(() => {
        fetchCompositions();
    }, [fetchCompositions]);

    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

    const onSaveComplete = (savedComposition: Composition) => {
        let _compositions = [...compositions]; // compositions is your local state array of Composition
        const index = _compositions.findIndex((c) => c._id === savedComposition._id);

        if (index !== -1) {
            // Update existing composition
            _compositions[index] = { ...savedComposition };
        } else {
            // Add new composition
            _compositions.push({ ...savedComposition });
        }
        setCompositions(_compositions);
        hideDialogs(); // closes the SaveDialog
    };


    const deleteComposition = async () => {
        const deleted = await CompositionApi.deleteComposition(selectedComposition);
        if (deleted) {
            setCompositions(compositions.filter((c) => c._id !== selectedComposition._id));
        }
    };

    const hideDialogs = () => {
        setSelectedComposition(emptyComposition);
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label={`Add ${constraint.constraint} Composition`} icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedComposition(emptyComposition);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Compositions</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Composition) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedComposition(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedComposition(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
                    <DataTable
                        ref={dt}
                        value={compositions}
                        selection={selectedComposition}
                        onSelectionChange={(e) => setSelectedComposition(e.value as Composition)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} compositions"
                        globalFilter={globalFilter}
                        emptyMessage="No composition data found."
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                    >
                        <Column selectionMode="single" style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        {isRangeConstraint(constraint.constraint as ApplicantConstraintType) &&
                            <Column field="min" header={`Min (${constraint.constraint})`} sortable />
                        }
                        {isRangeConstraint(constraint.constraint as ApplicantConstraintType) &&
                            <Column field="max" header={`Max (${constraint.constraint})`} sortable />
                        }
                        {isListConstraint(constraint.constraint as ApplicantConstraintType) &&
                            <Column field="item" header={`Item (${constraint.constraint})`} sortable />
                        }
                        <Column field="value" header={`Value (${constraint.mode})`} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>
                    {selectedComposition && (
                        <SaveDialog
                            visible={showSaveDialog}
                            composition={selectedComposition}
                            onComplete={onSaveComplete}
                            parent={constraint}
                            onHide={hideDialogs}
                        />
                    )}
                    {selectedComposition && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            item={String(selectedComposition.value)}
                            onConfirmAsync={deleteComposition}
                            onHide={hideDialogs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompositionManager;
