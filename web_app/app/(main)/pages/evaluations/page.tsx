'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { Directorate } from '@/models/directorate';
import { Evaluation, EvaluationStatus } from '@/models/evaluation/evaluation';
import { DirectorateService } from '@/services/DirectorateService';
import { EvaluationService } from '@/services/evaluation/EvaluationService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import SaveDialog from './dialogs/SaveDialog';
import PriorityAreaComp from '../../components/priorityArea/PriorityArea';
import StageComp from '../../components/stage/Stage';

const EvaluationPage = () => {

    const searchParams = useSearchParams();
    const directorateId = searchParams.get('directorate');
    const [directorate, setDirectorate] = useState<Directorate | null>(null);
    const router = useRouter();

    const emptyEvaluation: Evaluation = {
        directorate: directorate || '',
        title: '',
        status: EvaluationStatus.Active,
    };

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation>(emptyEvaluation);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);


    useEffect(() => {
        if (directorateId) {
            DirectorateService.getDirectorateByID(directorateId)
                .then((result) => {
                    if (!result) {
                        router.push('/auth/error'); // redirect if not found
                    } else {
                        setDirectorate(result);
                    }
                })
                .catch(() => {
                    router.push('/auth/error'); // also handle fetch errors
                });
        } else {
            // if no directorateId param, optionally redirect or handle differently
            router.push('/auth/error');
        }
    }, [directorateId, router]);

    const loadEvaluations = async () => {
        try {
            if (!directorate) return;
            const data = await EvaluationService.getEvaluationsByDirectorate(directorate);
            setEvaluations(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load evaluation data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    useEffect(() => {
        if (directorate) {
            loadEvaluations();
        }
    }, [directorate])

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveEvaluation = async () => {
        try {
            let _evaluations = [...evaluations];
            if (selectedEvaluation._id) {
                const updated = await EvaluationService.updateEvaluation(selectedEvaluation);
                const index = _evaluations.findIndex((c) => c._id === selectedEvaluation._id);
                _evaluations[index] = updated;
            } else {
                const created = await EvaluationService.createEvaluation(selectedEvaluation);
                _evaluations.push(created);
            }
            setEvaluations(_evaluations);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Evaluation ${selectedEvaluation._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save evaluation',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedEvaluation(emptyEvaluation);
        }
    };

    const deleteEvaluation = async () => {
        try {
            const deleted = await EvaluationService.deleteEvaluation(selectedEvaluation);
            if (deleted) {
                setEvaluations(evaluations.filter((c) => c._id !== selectedEvaluation._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Evaluation deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete evaluation',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedEvaluation(emptyEvaluation);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Evaluation" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedEvaluation(emptyEvaluation);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">{directorate?.directorate_name} Evaluations</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Evaluation) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedEvaluation(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedEvaluation(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    const statusBodyTemplate = (rowData: Evaluation) => {
        return (
            <span className={`theme-badge status-${rowData.status.toLowerCase()}`}>
                {rowData.status}
            </span>
        );
    };

    if (!directorate) {
        return <p>Loading...</p>;
    }

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
                        emptyMessage={`No ${directorate.directorate_name} evaluations data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(data) => (
                            <StageComp
                                evaluation={data as Evaluation}
                            />
                        )}
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedEvaluation && (
                        <SaveDialog
                            visible={showSaveDialog}
                            evaluation={selectedEvaluation}
                            onChange={setSelectedEvaluation}
                            onSave={saveEvaluation}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedEvaluation && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedEvaluation.title)}
                            onDelete={deleteEvaluation}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvaluationPage;
