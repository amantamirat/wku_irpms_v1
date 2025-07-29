'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import SaveDialog from './dialogs/SaveDialog';
import { Organization } from '@/models/organization';
import { Evaluation, EvalType } from '@/models/theme/evaluation';
import { EvalService } from '@/services/theme/EvalService';


const pluralMap = {
    Evaluation: 'Evaluations',
    Validation: 'Validations',
    Stage: 'Stages',
    Criterion: 'Criteria',
    Option: 'Options'
};

interface EvaluationCompProps {
    type: EvalType;
    directorate?: Organization;
    parent?: Evaluation;
}

const EvalComponent = (props: EvaluationCompProps) => {

    const type = props.type;
    const childType = type === (EvalType.evaluation || EvalType.validation) ?
        EvalType.stage : type === EvalType.stage ?
            EvalType.criterion : type === EvalType.criterion ?
                EvalType.option : null;


    const emptyEval: Evaluation = {
        title: '',
        type: props.type,
        directorate: props.directorate,
        parent: props.parent
    };

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation>(emptyEval);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };


    const loadEvaluations = useCallback(async () => {
        try {
            if (props.directorate && (props.type === EvalType.evaluation || props.type === EvalType.validation)) {
                const data = await EvalService.getEvaluationsByDirectorate(props.directorate._id || '');
                setEvaluations(data);
            } else if (props.parent) {
                const data = await EvalService.getEvaluationsByParent(props.parent._id || '');
                setEvaluations(data);
            }
        } catch (err) {
            console.error('Failed to load evaluations:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load evaluations data',
                detail: '' + err,
                life: 3000
            });
        }
    }, [props.parent, props.directorate, toast]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadEvaluations();
    }, [loadEvaluations]);

    const saveEvaluation = async () => {
        try {
            let _evlas = [...evaluations];
            if (selectedEvaluation._id) {
                const updated = await EvalService.updateEvaluation(selectedEvaluation);
                const index = _evlas.findIndex((c) => c._id === selectedEvaluation._id);
                _evlas[index] = updated;
            } else {
                const created = await EvalService.createEvaluation(selectedEvaluation);
                _evlas.push({ ...selectedEvaluation, _id: created._id });
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Evaluation ${selectedEvaluation._id ? 'updated' : 'created'}`,
                life: 3000
            });
            setEvaluations(_evlas);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save theme',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedEvaluation(emptyEval);
        }
    };

    const deleteEvaluation = async () => {
        try {
            const deleted = await EvalService.deleteEvaluation(selectedEvaluation);
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
                summary: 'Failed to delete theme',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedEvaluation(emptyEval);
        }
    };

    const reorderStage = async (evaluation: Evaluation, direction: "up" | "down") => {
        try {
            if (!evaluation.stage_level) {
                throw new Error("Stage Level is Required");
            }
            let _evlas = [...evaluations];
            const currentLevel = evaluation.stage_level;
            const targetLevel = direction === "up" ? currentLevel - 1 : currentLevel + 1;
            const currentIndex = _evlas.findIndex((c) => c._id === evaluation._id);
            const targetIndex = _evlas.findIndex((c) => c.stage_level === targetLevel);
            if (currentIndex === -1 || targetIndex === -1) {
                throw new Error("Target or current stage not found in list.");
            }
            const moved = await EvalService.reorderStage(evaluation, direction);
            if (moved) {
                _evlas[currentIndex] = { ..._evlas[currentIndex], stage_level: targetLevel };
                _evlas[targetIndex] = { ..._evlas[targetIndex], stage_level: currentLevel };
                setEvaluations(_evlas);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Moved',
                    detail: `Stage moved ${direction}`,
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to move stage',
                detail: '' + err,
                life: 3000
            });
        } finally {
            //setShowDeleteDialog(false);
            setSelectedEvaluation(emptyEval);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label={`New ${type}`} icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    let newEval = { ...emptyEval };
                    if (type === EvalType.stage) {
                        const stages = evaluations.filter(e => e.type === EvalType.stage);
                        const maxLevel = Math.max(0, ...stages.map(e => e.stage_level ?? 0));
                        newEval.stage_level = maxLevel + 1;
                    }
                    setSelectedEvaluation(newEval);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">
                Manage {props.directorate?.name} {props.parent?.title} {pluralMap[type]}
            </h5>
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

    const orderBodyTemplate = (rowData: Evaluation) => (
        <>
            <Button icon="pi pi-sort-numeric-up" severity="success" className="p-button-rounded p-button-text"
                tooltip="move the stage up" style={{ fontSize: '1.2rem' }} onClick={async () => {
                    reorderStage(rowData, "up");
                }} />
            <Button icon="pi pi-sort-numeric-down" severity="danger" className="p-button-rounded p-button-text"
                tooltip="move the stage down" style={{ fontSize: '1.2rem' }} onClick={async () => {
                    reorderStage(rowData, "down");
                }} />

        </>
    );

    const formTypeBodyTemplate = (rowData: Evaluation) => {
        return (
            <span className={`form-badge type-${rowData.form_type?.toLowerCase()}`}>
                {rowData.form_type}
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
                        value={evaluations}
                        selection={selectedEvaluation}
                        onSelectionChange={(e) => setSelectedEvaluation(e.value as Evaluation)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate={`Showing {first} to {last} of {totalRecords} ${pluralMap[type]}`}
                        globalFilter={globalFilter}
                        emptyMessage={`No ${pluralMap[type]} data found.`}
                        header={header}
                        scrollable
                        filters={filters}
                        {...(childType && {
                            expandedRows: expandedRows,
                            onRowToggle: (e) => setExpandedRows(e.data),
                            rowExpansionTemplate: (data) => (
                                <EvalComponent
                                    type={childType}
                                    parent={data as Evaluation}
                                />
                            )
                        })}
                    >
                        {
                            childType
                                ? <Column expander style={{ width: '3em' }} />
                                : <Column selectionMode="single" headerStyle={{ width: '3em' }} />
                        }
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="title" header="Title" sortable />
                        {type === EvalType.stage && (
                            <Column field="stage_level" header="Level" sortable />
                        )}
                        {type === EvalType.stage && (
                            <Column body={orderBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                        )}
                        {type === EvalType.criterion && (
                            <Column field="weight_value" header="Weight" sortable />
                        )}
                        {type === EvalType.criterion && (
                            <Column field="form_type" header="Form Type" body={formTypeBodyTemplate} sortable />
                        )}
                        {type === EvalType.option && (
                            <Column field="weight_value" header="Value" sortable />
                        )}
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                    </DataTable>

                    {selectedEvaluation && (
                        <SaveDialog
                            visible={showSaveDialog}
                            evaluation={selectedEvaluation}
                            onChange={setSelectedEvaluation}
                            onSave={saveEvaluation}
                            onHide={() => {
                                setShowSaveDialog(false);
                                setSelectedEvaluation(emptyEval);
                            }}
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

export default EvalComponent;
