'use client';
import ConfirmDialog from '@/components/ConfirmationDialog';
import ErrorComponent from '@/components/ErrorComponent';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { FileUpload } from 'primereact/fileupload';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EvaluationApi } from '../api/evaluation.api';
import { EvalType, Evaluation, FormType } from '../models/evaluation.model';
import SaveDialog from './dialogs/SaveDialog';

const pluralMap = {
    Evaluation: 'Evaluations',
    Validation: 'Validations',
    Stage: 'Stages',
    Criterion: 'Criteria',
    Option: 'Options'
};

interface EvaluationManagerProps {
    type: EvalType;
    parent?: Evaluation;
}

const EvaluationManager = ({ type, parent }: EvaluationManagerProps) => {
    const isEvaluation = type === EvalType.evaluation;
    const isValidation = type === EvalType.validation;
    const isStage = type === EvalType.stage;
    const isCriterion = type === EvalType.criterion;
    const childType = isEvaluation || isValidation ? EvalType.stage
        : isStage ? EvalType.criterion
            : isCriterion ? EvalType.option : null;


    const emptyEval: Evaluation = {
        title: '',
        type: type,
        directorate: '',
        parent: parent
    };

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation>(emptyEval);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);
    const [loading, setLoading] = useState(false);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);


    const fetchEvaluations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await EvaluationApi.getEvaluations({
                type: type,
                parent: parent?._id
            });
            setEvaluations(data);
        } catch (err) {
            setError(`Failed to load grant data ${err}`);
        } finally {
            setLoading(false);
        }
    }, [parent]);

    useEffect(() => {
        fetchEvaluations();
    }, [fetchEvaluations]);


    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

    const onSaveComplete = (savedEvaluation: Evaluation) => {
        let _evaluations = [...evaluations]; // evaluations is your local state array
        const index = _evaluations.findIndex((e) => e._id === savedEvaluation._id);
        if (index !== -1) {
            _evaluations[index] = { ...savedEvaluation };
        } else {
            _evaluations.push({ ...savedEvaluation });
        }
        setEvaluations(_evaluations); // update state
        hideDialogs(); // hide your SaveDialog
    };


    const deleteEvaluation = async () => {
        setLoading(true);
        const deleted = await EvaluationApi.deleteEvaluation(selectedEvaluation);
        if (deleted) {
            //setEvaluations(evaluations.filter((c) => c._id !== selectedEvaluation._id));
            setEvaluations((prevEvals) => {
                let updated = prevEvals.filter((c) => c._id !== selectedEvaluation._id);
                // Explicitly check that stage_level is a number
                if (
                    selectedEvaluation.type === 'Stage' &&
                    selectedEvaluation.parent &&
                    typeof selectedEvaluation.order === 'number'
                ) {
                    updated = updated.map((e) => {
                        if (
                            e.type === 'Stage' &&
                            e.parent === selectedEvaluation.parent &&
                            typeof e.order === 'number' &&
                            e.order > selectedEvaluation.order!
                        ) {
                            return { ...e, order: e.order - 1 };
                        }
                        return e;
                    });
                }
                return updated;
            });
        }
        hideDialogs();
        setLoading(false);

    };

    const reorderStage = async (evaluation: Evaluation, direction: "up" | "down") => {
        try {
            setLoading(true);
            if (!evaluation.order) {
                throw new Error("Stage Level is Required");
            }
            let _evlas = [...evaluations];
            const currentLevel = evaluation.order;
            const targetLevel = direction === "up" ? currentLevel - 1 : currentLevel + 1;
            const currentIndex = _evlas.findIndex((c) => c._id === evaluation._id);
            const targetIndex = _evlas.findIndex((c) => c.order === targetLevel);
            if (currentIndex === -1 || targetIndex === -1) {
                throw new Error("Target or current stage not found in list.");
            }
            const moved = await EvaluationApi.reorderStage(evaluation, direction);
            if (moved) {
                _evlas[currentIndex] = { ..._evlas[currentIndex], order: targetLevel };
                _evlas[targetIndex] = { ..._evlas[targetIndex], order: currentLevel };
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
            setLoading(false);
        }
    };


    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setSelectedEvaluation(emptyEval);
    }


    const endToolbarTemplate = () => {
        if (type !== EvalType.criterion) {
            return null;
        }
        // Handler for file upload and import
        const handleImport = async (event: any) => {
            try {
                setLoading(true);
                const file = event.files[0];
                if (!file) return;
                const text = await file.text();
                const json = JSON.parse(text);
                // Expecting { criteriaData: [...], stageId: ... } or just array
                let criteriaData, stageId;
                if (Array.isArray(json)) {
                    criteriaData = json;
                    stageId = parent?._id;
                } else {
                    criteriaData = json.criteriaData;
                    stageId = json.stageId || parent?._id;
                }
                if (!stageId || !Array.isArray(criteriaData)) {
                    toast.current?.show({ severity: 'error', summary: 'Import Error', detail: 'Invalid import data', life: 3000 });
                    return;
                }
                // Call API
                const result = await EvaluationApi.importCriteriaBatch(stageId, criteriaData);
                // Reload evaluations
                await fetchEvaluations();
                toast.current?.show({ severity: 'success', summary: 'Import Successful', detail: `Imported ${result.length} criteria`, life: 3000 });
            } catch (err) {
                toast.current?.show({ severity: 'error', summary: 'Import Failed', detail: '' + err, life: 3000 });
            } finally {
                setLoading(false);
            }
        };
        return (
            <div className="my-2">
                <FileUpload mode="basic" accept="application/json" maxFileSize={1000000} chooseLabel="Import" className="mr-2 inline-block"
                    customUpload uploadHandler={handleImport}
                />
            </div>
        );
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label={`New ${type}`} icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    let nextEval = { ...emptyEval };
                    if (isStage) {
                        const stages = evaluations.filter(e => e.type === EvalType.stage);
                        const maxLevel = Math.max(0, ...stages.map(e => e.order ?? 0));
                        nextEval = { ...emptyEval, order: maxLevel + 1 };
                    }
                    setSelectedEvaluation(nextEval);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">
                Manage {parent?.title} {pluralMap[type]}
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
                    <Toolbar className="mb-4" start={startToolbarTemplate} end={endToolbarTemplate}></Toolbar>
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
                        loading={loading}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(rowData) => {
                            if (!childType) {
                                return null;
                            }
                            if (isCriterion && (rowData as Evaluation).form_type !== FormType.closed) {
                                return null; // no expansion content for non closed
                            }
                            return <EvaluationManager type={childType} parent={rowData as Evaluation} />;
                        }}
                    >
                        {
                            (childType)
                                ? <Column expander style={{ width: '3em' }} />
                                : <Column selectionMode="single" headerStyle={{ width: '3em' }} />
                        }
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        {isEvaluation &&
                            <Column field="directorate.name" header="Directorate" sortable />
                        }
                        <Column field="title" header="Title" sortable />
                        {isStage && (
                            <Column field="order" header="Order" sortable />
                        )}
                        {isStage && (
                            <Column body={orderBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                        )}
                        {isCriterion && (
                            <Column field="weight_value" header="Weight" sortable />
                        )}
                        {isCriterion && (
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
                            onComplete={onSaveComplete}
                            onHide={hideDialogs}
                        />
                    )}

                    {selectedEvaluation && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedEvaluation.title)}
                            onConfirmAsync={deleteEvaluation}
                            onHide={hideDialogs}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvaluationManager;
