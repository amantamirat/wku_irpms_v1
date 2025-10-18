import ConfirmDialog from "@/components/ConfirmationDialog";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { Reviewer } from "../../reviewers/models/reviewer.model";
import { ResultApi } from "../api/result.api";
import { Result } from "../models/result.model";
import { EvalType, Evaluation, evaluationTemplate, FormType } from "@/app/(main)/evals/models/evaluation.model";
import { EvaluationApi } from "@/app/(main)/evals/api/evaluation.api";
import EditResultDialog from "./EditResultDialog";

interface ResultManagerProps {
    evaluator?: Reviewer;
}

const ResultManager = ({ evaluator }: ResultManagerProps) => {
    const [criteria, setCriteria] = useState<Evaluation[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [selectedResult, setSelectedResult] = useState<Result | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Fetch criteria and merge with existing results
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1️⃣ Fetch all criteria
                const fetchedCriteria = await EvaluationApi.getEvaluations({ type: EvalType.criterion });

                // 2️⃣ Fetch existing results for this evaluator
                const fetchedResults = await ResultApi.getResults({
                    evaluator: evaluator && evaluator._id ? evaluator._id : undefined
                });

                // 3️⃣ Merge: ensure all criteria have corresponding result entries
                const mergedResults: Result[] = fetchedCriteria.map((criterion: Evaluation) => {
                    const existing = fetchedResults.find(
                        (r: Result) => (r.criterion as Evaluation)?._id === criterion._id
                    );
                    return (
                        existing || {
                            criterion,
                            score: 0,
                            evaluator: evaluator || "",
                        }
                    );
                });

                setCriteria(fetchedCriteria);
                setResults(mergedResults);
            } catch (err) {
                console.error("Error fetching criteria or results:", err);
            }
        };

        fetchData();
    }, [evaluator]);

    // 🔹 Save completed
    const onSaveComplete = (savedResult: Result) => {
        const updatedResults = results.map((r) =>
            (r.criterion as Evaluation)._id === (savedResult.criterion as Evaluation)._id
                ? savedResult
                : r
        );
        setResults(updatedResults);
        hideDialogs();
    };

    const deleteResult = async () => {
        if (!selectedResult?._id) return;
        const deleted = await ResultApi.deleteResult(selectedResult);
        if (deleted) {
            setResults(results.map(r =>
                (r.criterion as Evaluation)._id === (selectedResult.criterion as Evaluation)._id
                    ? { ...r, _id: undefined, score: 0 } // reset instead of removing
                    : r
            ));
            hideDialogs();
        }
    };

    const hideDialogs = () => {
        setSelectedResult(null);
        setShowAddDialog(false);
        setShowDeleteDialog(false);
    };

    const endToolbarTemplate = () => (
        <div className="my-2">
            <Button label="Submit" icon="pi pi-check" outlined severity="success" />
        </div>
    );

    const scoreTemplate = (rowData: Result) => {
        const criterion = rowData.criterion as Evaluation;
        if (!criterion) return "";

        // If the criterion is Closed, show the selected option title
        if (criterion.form_type === FormType.closed) {
            return rowData.selected_option
                ? evaluationTemplate(rowData.selected_option as Evaluation)
                : "-";
        }

        // Otherwise, show the numeric score
        return rowData.score ?? "-";
    };

    const actionBodyTemplate = (rowData: Result) => (
        <>
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                className="p-button-rounded p-button-text"
                onClick={() => {
                    setSelectedResult(rowData);
                    setShowAddDialog(true);
                }}
            />
            {rowData._id && (
                <Button
                    icon="pi pi-times"
                    rounded
                    severity="warning"
                    className="p-button-rounded p-button-text"
                    onClick={() => {
                        setSelectedResult(rowData);
                        setShowDeleteDialog(true);
                    }}
                />
            )}
        </>
    );

    return (
        <div className="card">
            <Toolbar className="mb-4" end={endToolbarTemplate} />
            <DataTable
                value={results}
                selection={selectedResult}
                onSelectionChange={(e) => setSelectedResult(e.value as Result)}
                dataKey={"criterion._id"}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="datatable-responsive"
                emptyMessage={"No criteria or results found."}
                scrollable
                tableStyle={{ minWidth: "50rem" }}
            >
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: "50px" }} />
                <Column field="criterion.title" header="Criterion" sortable />
                <Column body={scoreTemplate} header="Score" sortable />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
            </DataTable>


            {
                selectedResult &&
                <EditResultDialog
                    visible={showAddDialog}
                    result={selectedResult}
                    onCompelete={onSaveComplete}
                    onHide={hideDialogs}
                />
            }

            {selectedResult && (
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    selectedDataInfo={`result (score ${selectedResult.score})`}
                    onConfirmAsync={deleteResult}
                    onHide={hideDialogs}
                />
            )}
        </div>
    );
};

export default ResultManager;
