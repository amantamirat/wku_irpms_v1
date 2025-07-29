'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { ResponseType, Weight } from '@/models/evaluation/weight';
import { WeightService } from '@/services/evaluation/WeightService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Stage } from '@/models/evaluation/stage';
import SaveDialog from './dialog/SaveDialog';
import { CriterionOption } from '@/models/evaluation/criterionOption';
import { CriterionOptionService } from '@/services/evaluation/CriterionOptionService';

interface WeightCompProps {
    stage: Stage;
}

const WeightComp = (props: WeightCompProps) => {

    const { stage } = props;

    const emptyWeight: Weight = {
        stage: stage,
        title: '',
        weight_value: 0,
        response_type: ResponseType.Open
    };

    const [weights, setWeights] = useState<Weight[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedWeight, setSelectedWeight] = useState<Weight>(emptyWeight);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [criterionOptions, setCriterionOptions] = useState<CriterionOption[]>([]);


    const loadWeights = async () => {
        try {
            if (!stage) return;
            const data = await WeightService.getWeightsByStage(stage);
            setWeights(data);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load weight data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadWeights();
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveWeight = async () => {
        try {
            let _weights = [...weights];
            if (selectedWeight._id) {
                const updated = await WeightService.updateWeightWithCriterionOptions({ weight: selectedWeight, criterionOptions: criterionOptions });
                const index = _weights.findIndex((c) => c._id === selectedWeight._id);
                _weights[index] = updated;
            } else {
                const created = await WeightService.createWeightWithCriterionOptions({ weight: selectedWeight, criterionOptions: criterionOptions });
                _weights.push(created);
            }
            setWeights(_weights);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Weight ${selectedWeight._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save weight',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedWeight(emptyWeight);
        }
    };

    const deleteWeight = async () => {
        try {
            const deleted = await WeightService.deleteWeight(selectedWeight);
            if (deleted) {
                setWeights(weights.filter((c) => c._id !== selectedWeight._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Weight deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete weight',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedWeight(emptyWeight);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="Add Criterion" icon="pi pi-plus" severity="info" className="mr-2"
                onClick={() => {
                    setSelectedWeight(emptyWeight);
                    setCriterionOptions([]);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">{stage.title} Criteria</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Weight) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={async () => {
                    try {
                        setSelectedWeight(rowData);
                        if (rowData.response_type === ResponseType.Closed) {
                            const data = await CriterionOptionService.getCriterionOptionsByWeight(rowData);
                            setCriterionOptions(data);
                        }
                        setShowSaveDialog(true);
                    } catch (err) {
                        toast.current?.show({
                            severity: 'error',
                            summary: 'Failed to edit criteria',
                            detail: '' + err,
                            life: 3000
                        });
                    }

                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedWeight(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );


    const responseTypeBodyTemplate = (rowData: Weight) => {
        return (
            <span className={`form-badge form_type-${rowData.response_type.toLowerCase()}`}>
                {rowData.response_type}
            </span>
        );
    };



    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
                    <DataTable
                        ref={dt}
                        value={weights}
                        selection={selectedWeight}
                        onSelectionChange={(e) => setSelectedWeight(e.value as Weight)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} weights"
                        globalFilter={globalFilter}
                        emptyMessage={`No ${stage.title} weights data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Creteria" sortable />
                        <Column field="weight_value" header="Weight" sortable />
                        <Column field="response_type" header="Type" body={responseTypeBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedWeight && (
                        <SaveDialog
                            visible={showSaveDialog}
                            weight={selectedWeight}
                            setWeight={setSelectedWeight}
                            criterionOptions={criterionOptions}
                            setCriterionOptions={setCriterionOptions}
                            onSave={saveWeight}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedWeight && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedWeight.title)}
                            onDelete={deleteWeight}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeightComp;
