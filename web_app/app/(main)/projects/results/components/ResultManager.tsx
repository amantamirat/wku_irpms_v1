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
import { Criterion, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import { Option } from "@/app/(main)/evaluations/models/option.model";
import { CriterionApi } from "@/app/(main)/evaluations/api/criterion.api";
import { ProjectStage } from "../../stages/models/stage.model";

interface ResultManagerProps {
    reviewer?: Reviewer;
}

const ResultManager = ({ reviewer }: ResultManagerProps) => {
    //const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [selectedResult, setSelectedResult] = useState<Result | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);


    useEffect(() => {

        const fetchData = async () => {
            try {
                const fetchedCriteria =
                    await CriterionApi.getCriteria({ stage: (reviewer?.projectStage as ProjectStage).stage });
                const fetchedResults =
                    await ResultApi.getResults({ evaluator: reviewer?._id || "" });

                const mergedResults: Result[] = fetchedCriteria.map((criterion: Criterion) => {
                    const existing = fetchedResults.find(
                        (r: Result) => (r.criterion as Criterion)?._id === criterion._id
                    );
                    return (
                        existing || {
                            criterion,
                            score: 0,
                            evaluator: reviewer || "",
                        }
                    );
                });
                setResults(mergedResults);
            } catch (err) {
                console.error("Error fetching criteria or results:", err);
            }
        };

        fetchData();

    }, [reviewer]);


    const onSaveComplete = (savedResult: Result) => {
        const updatedResults = results.map((r) =>
            (r.criterion as Criterion)._id === (savedResult.criterion as Criterion)._id
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
                (r.criterion as Criterion)._id === (selectedResult.criterion as Criterion)._id
                    ? { ...r, _id: undefined, score: 0, selected_option: undefined } // reset instead of removing
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

    const calculateTotalScore = () => {
        return results.reduce((sum, r) => {
            const criterion = r.criterion as Criterion;
            if (!criterion) return sum;

            if (criterion.form_type === FormType.closed && r.selected_option) {
                const optionEval = r.selected_option as Option;
                return sum + (optionEval.score || 0);
            } else if (criterion.form_type !== FormType.closed && r.score) {
                return sum + r.score;
            }
            return sum;
        }, 0);
    };



    const scoreTemplate = (rowData: Result) => {
        const criterion = rowData.criterion as Criterion;
        if (!criterion) return "";
        if (criterion.form_type === FormType.closed) {
            return rowData.selected_option
                ? (rowData.selected_option as Option).title
                : "-";
        }
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

    const endToolbarTemplate = () => (
        <div className="my-2">
            <Button label="Submit" icon="pi pi-check" outlined severity="success" />
        </div>
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
                <Column body={scoreTemplate} header="Score" sortable footer={<strong>Total: {calculateTotalScore()}</strong>} />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} />
            </DataTable>

            {
                selectedResult &&
                <SaveResultDialog
                    visible={showAddDialog}
                    result={selectedResult}
                    criterion={selectedResult.criterion as Criterion}
                    onCompelete={onSaveComplete}
                    onHide={hideDialogs}
                />
            }

            {
                selectedResult &&
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    title={`result (score ${selectedResult.score})`}
                    onConfirmAsync={deleteResult}
                    onHide={hideDialogs}
                />
            }
        </div>
    );
};

export default ResultManager;
