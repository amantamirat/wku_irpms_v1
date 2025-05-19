'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { Evaluation } from '@/models/evaluation/evaluation';
import { Stage } from '@/models/evaluation/stage';
import { StageService } from '@/services/evaluation/StageService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import WeightComp from '../weight/Weight.component';
import SaveDialog from './dialog/SaveDialog';

interface StageCompProps {
    evaluation: Evaluation;
}

const StageComp = (props: StageCompProps) => {

    const { evaluation } = props;

    const emptyStage: Stage = {
        evaluation: evaluation,
        title: '',
        level: 0
    };

    const [stages, setStages] = useState<Stage[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedStage, setSelectedStage] = useState<Stage>(emptyStage);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);


    const loadStages = async () => {
        try {
            if (!evaluation) return;
            const data = await StageService.getStagesByEvaluation(evaluation);
            setStages(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load stage data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadStages();
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveStage = async () => {
        try {
            let _stages = [...stages];
            if (selectedStage._id) {
                const updated = await StageService.updateStage(selectedStage);
                const index = _stages.findIndex((c) => c._id === selectedStage._id);
                _stages[index] = updated;
            } else {
                const created = await StageService.createStage(selectedStage);
                _stages.push(created);
            }
            setStages(_stages);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Stage ${selectedStage._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save stage',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedStage(emptyStage);
        }
    };

    const deleteStage = async () => {
        try {
            const deleted = await StageService.deleteStage(selectedStage);
            if (deleted) {
                setStages(stages.filter((c) => c._id !== selectedStage._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Stage deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete stage',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedStage(emptyStage);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Priority Area" icon="pi pi-plus" severity="secondary" className="mr-2"
                onClick={() => {
                    setSelectedStage(emptyStage);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage {evaluation.title} Stages</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Stage) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedStage(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedStage(rowData);
                    setShowDeleteDialog(true);
                }} />
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
                        value={stages}
                        selection={selectedStage}
                        onSelectionChange={(e) => setSelectedStage(e.value as Stage)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} stages"
                        globalFilter={globalFilter}
                        emptyMessage={`No ${evaluation.title} stages data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(data) => (
                            <WeightComp
                                stage={data as Stage}
                            />
                        )}
                        
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                    </DataTable>

                    {selectedStage && (
                        <SaveDialog
                            visible={showSaveDialog}
                            stage={selectedStage}
                            onChange={setSelectedStage}
                            onSave={saveStage}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedStage && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedStage.title)}
                            onDelete={deleteStage}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default StageComp;
