'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
//import { Evaluation } from '../../evaluations/models/evaluation.model';
import { StageApi } from '../api/stage.api';
import { Call } from '../models/call.model';
import { Stage, StageStatus, StageType } from '../models/stage.model';
import SaveStage from './SaveStage';

interface StageManagerProps {
    call: Call;
}

const StageManager = ({ call }: StageManagerProps) => {
    const toast = useRef<Toast>(null);

    const emptyStage: Stage = {
        call: call,
        name: '',
        type: StageType.evaluation,
        evaluation: '',
        status: StageStatus.planned,
    };

    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedStage, setSelectedStage] = useState<Stage>(emptyStage);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    // Init filters
    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

   
    // Fetch stages for this call
    const fetchStages = useCallback(async () => {
        try {
            const data = await StageApi.getStages({ call: call._id });
            setStages(data);
        } catch (err) {
            console.error('Failed to fetch stages:', err);
        }
    }, [call]);

    useEffect(() => {
        if (call._id) fetchStages();
    }, [call, fetchStages]);

    // Handle save (create/update)
    const onSaveComplete = (savedStage: Stage) => {
        const index = stages.findIndex((s) => s._id === savedStage._id);
        let _stages = [...stages];
        if (index !== -1) _stages[index] = savedStage;
        else _stages.push(savedStage);
        setStages(_stages);
        hideDialogs();
    };

    // Delete stage
    const deleteStage = async () => {
        try {
            const deleted = await StageApi.deleteStage(selectedStage);
            if (deleted) setStages(stages.filter((s) => s._id !== selectedStage._id));
            hideDialogs();
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Delete Failed',
                detail: err.message,
                life: 2500,
            });
        }
    };

    const hideDialogs = () => {
        setSelectedStage(emptyStage);
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button
                label="New Stage"
                icon="pi pi-plus"
                severity="success"
                onClick={() => {
                    setSelectedStage(emptyStage);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const actionBodyTemplate = (rowData: Stage) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                onClick={() => {
                    setSelectedStage(rowData);
                    setShowSaveDialog(true);
                }}
            />
            <Button
                icon="pi pi-trash"
                rounded
                severity="warning"
                className="p-button-rounded p-button-text"
                onClick={() => {
                    setSelectedStage(rowData);
                    setShowDeleteDialog(true);
                }}
            />
        </>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" start={startToolbarTemplate} />
            <span className="block mt-2 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    value={globalFilter}
                    onChange={onGlobalFilterChange}
                    placeholder="Search..."
                    className="w-full md:w-1/3"
                />
            </span>
            <DataTable
                value={stages}
                dataKey="_id"
                paginator
                rows={10}
                emptyMessage="No stages found"
                globalFilter={globalFilter}
                scrollable
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
            >
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                <Column field="name" header="Stage Name" sortable />
                <Column field="type" header="Type" sortable />
                <Column field="evaluation.title" header="Evaluation" sortable />
                <Column field="deadline" header="Deadline" body={(rowData) => rowData.deadline ? new Date(rowData.deadline).toLocaleDateString() : ''} />
                <Column field="status" header="Status" sortable />
                <Column body={actionBodyTemplate} style={{ minWidth: '10rem' }} />
            </DataTable>

            {selectedStage && showSaveDialog && (
                <SaveStage
                    visible={showSaveDialog}
                    stage={selectedStage}
                    onComplete={onSaveComplete}
                    onHide={() => setShowSaveDialog(false)}
                />
            )}

            {selectedStage && showDeleteDialog && (
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    selectedDataInfo={selectedStage.name || ''}
                    onConfirmAsync={deleteStage}
                    onHide={() => setShowDeleteDialog(false)}
                />
            )}
        </div>
    );
};

export default StageManager;
