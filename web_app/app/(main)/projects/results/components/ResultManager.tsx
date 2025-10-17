import ConfirmDialog from "@/components/ConfirmationDialog";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { Reviewer } from "../../reviewers/models/reviewer.model";
import { ResultApi } from "../api/result.api";
import { Result } from "../models/result.model";
import SaveResultDialog from "./SaveResultDialog";

interface ResultManagerProps {
    criterion?: string;
    evaluator?: Reviewer;
}

const ResultManager = ({ criterion, evaluator }: ResultManagerProps) => {
    const emptyResult: Result = {
        evaluator: evaluator || "",
        criterion: criterion || "",
        score: 0,
        comment: ""
    };

    const [result, setResult] = useState<Result>(emptyResult);
    const [results, setResults] = useState<Result[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            const data = await ResultApi.getResults({
                criterion,
                evaluator: evaluator && evaluator._id ? evaluator._id : undefined
            });
            setResults(data);
        };
        fetchResults();
    }, [criterion, evaluator]);

    const onSaveCompelete = (savedResult: Result) => {
        let _results = [...results];
        const index = _results.findIndex((c) => c._id === savedResult._id);
        if (index !== -1) {
            _results[index] = { ...savedResult }
        } else {
            _results.push({ ...savedResult });
        }
        setResults(_results);
        hideDialogs();
    };

    const deleteResult = async () => {
        const deleted = await ResultApi.deleteResult(result);
        if (deleted) {
            setResults(results.filter((c) => c._id !== result._id));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setResult(emptyResult);
        setShowAddDialog(false);
        setShowDeleteDialog(false);
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip="Add Result"
                onClick={() => {
                    setResult(emptyResult);
                    setShowAddDialog(true);
                }}
            />
        </div>
    );

    const actionBodyTemplate = (rowData: Result) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setResult(rowData);
                    setShowAddDialog(true);
                }} />
            <Button icon="pi pi-times" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setResult(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    return (
        <>
            <div className="card">
                <Toolbar className="mb-4" start={startToolbarTemplate} />
                <DataTable
                    value={results}
                    selection={result}
                    onSelectionChange={(e) => setResult(e.value as Result)}
                    dataKey={"_id"}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    className="datatable-responsive"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    emptyMessage={'No result found.'}
                    scrollable
                    tableStyle={{ minWidth: '50rem' }}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                    <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                    <Column field="criterion.title" header="Criterion" sortable />
                    <Column field="score" header="Score" sortable />                                      
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                </DataTable>

                {result &&
                    <SaveResultDialog
                        visible={showAddDialog}
                        result={result}
                        onCompelete={onSaveCompelete}
                        onHide={hideDialogs}
                    />}

                {result && (
                    <ConfirmDialog
                        showDialog={showDeleteDialog}
                        selectedDataInfo={`result (score ${result.score})`}
                        onConfirmAsync={deleteResult}
                        onHide={hideDialogs}
                    />
                )}
            </div>
        </>
    );
}

export default ResultManager;