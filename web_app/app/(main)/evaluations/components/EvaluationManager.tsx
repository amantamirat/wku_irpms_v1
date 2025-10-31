'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import ErrorComponent from '@/components/ErrorComponent';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EvaluationApi } from '../api/evaluation.api';
import { Evaluation } from '../models/evaluation.model';
import SaveEvaluation from './SaveEvaluation';

const EvaluationManager = () => {
    const emptyEvaluation: Evaluation = {
        directorate: '',
        title: '',
    };

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation>(emptyEvaluation);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);
    const toast = useRef<Toast>(null);

    // Initialize filter
    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    // Fetch evaluations
    const fetchEvaluations = useCallback(async () => {
        try {
            const data = await EvaluationApi.getUserEvaluations();
            setEvaluations(data);
        } catch (err) {
            setError(`Failed to load evaluation data: ${err}`);
        }
    }, []);

    useEffect(() => {
        fetchEvaluations();
    }, [fetchEvaluations]);

    if (error) {
        return <ErrorComponent errorMessage={error} />;
    }

    // Handle save (create or update)
    const onSaveComplete = (savedEval: Evaluation) => {
        let _evaluations = [...evaluations];
        const index = _evaluations.findIndex((a) => a._id === savedEval._id);
        if (index !== -1) {
            _evaluations[index] = { ...savedEval };
        } else {
            _evaluations.push({ ...savedEval });
        }
        setEvaluations(_evaluations);
        hideDialogs();
    };

    // Delete evaluation
    const deleteEvaluation = async () => {
        const deleted = await EvaluationApi.deleteEvaluation(selectedEvaluation);
        if (deleted) {
            setEvaluations(evaluations.filter((c) => c._id !== selectedEvaluation._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedEvaluation(emptyEvaluation);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                label="New Evaluation"
                icon="pi pi-plus"
                severity="success"
                className="mr-2"
                onClick={() => {
                    setSelectedEvaluation(emptyEvaluation);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Evaluations</h5>
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

    const actionBodyTemplate = (rowData: Evaluation) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }}
                onClick={() => {
                    setSelectedEvaluation(rowData);
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
                    setSelectedEvaluation(rowData);
                    setShowDeleteDialog(true);
                }}
            />
        </>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>

                    <DataTable
                        ref={dt}
                        value={evaluations}
                        selection={selectedEvaluation}
                        onSelectionChange={(e) => setSelectedEvaluation(e.value as Evaluation)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} evaluations"
                        globalFilter={globalFilter}
                        emptyMessage="No evaluation data found."
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="directorate.name" header="Directorate" sortable />
                        <Column field="title" header="Title" sortable />
                        <Column field="description" header="Description" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedEvaluation && (
                        <SaveEvaluation
                            visible={showSaveDialog}
                            evaluation={selectedEvaluation}
                            onComplete={onSaveComplete}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedEvaluation && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedEvaluation.title)}
                            onConfirmAsync={deleteEvaluation}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvaluationManager;
