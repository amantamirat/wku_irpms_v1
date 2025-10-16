import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmationDialog";
import { Result } from "../models/result.model";
import { ResultApi } from "../api/result.api";
import SaveResultDialog from "./SaveResultDialog";
import { Reviewer } from "../../reviewers/models/reviewer.model";

interface ResultManagerProps {
    criterion?: string;
    evaluator?: Reviewer;
}

export default function ResultManager({ criterion, evaluator }: ResultManagerProps) {
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

    const saveResult = async () => {
        let _results = [...results];
        if (result._id) {
            const updated = await ResultApi.updateResult(result);
            const index = _results.findIndex((c) => c._id === updated._id);
            _results[index] = { ...result, updatedAt: updated.updatedAt };
        } else {
            const created = await ResultApi.createResult(result);
            _results.push({ ...created });
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
                    dataKey={results?.some(r => r._id) ? "_id" : "score"}
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
                    <Column field="score" header="Score" sortable />
                    <Column field="comment" header="Comment" sortable />
                    <Column field="status" header="Status" sortable />
                    <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                </DataTable>

                {result &&
                    <SaveResultDialog
                        result={result}
                        setResult={setResult}
                        visible={showAddDialog}
                        onSave={saveResult}
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
