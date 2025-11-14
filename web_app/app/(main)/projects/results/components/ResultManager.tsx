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
import { useAuth } from "@/contexts/auth-context";

interface ResultManagerProps {
    reviewer?: Reviewer;
}

const ResultManager = ({ reviewer }: ResultManagerProps) => {

    const { getLinkedApplicant } = useAuth();
    const applicant = getLinkedApplicant();
    const loggedApplicantId = applicant?._id ?? applicant;
    const canEdit = (reviewer?.applicant as any)._id === loggedApplicantId;

    const [results, setResults] = useState<Result[]>([]);
    const [selectedResult, setSelectedResult] = useState<Result | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!reviewer?._id || !reviewer?.projectStage) return;
                const projectStage = reviewer.projectStage as ProjectStage;
                const stageId =
                    typeof projectStage.stage === "string"
                        ? projectStage.stage
                        : (projectStage.stage as any)?._id;

                const fetchedCriteria = await CriterionApi.getCriteria({ stage: stageId });
                const fetchedResults = await ResultApi.getResults({ reviewer: reviewer._id });

                const mergedResults: Result[] = fetchedCriteria.map((criterion: Criterion) => {
                    const existing = fetchedResults.find(
                        (r: Result) => (r.criterion as Criterion)?._id === criterion._id
                    );
                    return (
                        existing || {
                            criterion,
                            score: 0,
                            reviewer: reviewer,
                            selected_option: ""
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



    const onSaveComplete = (saved: Result) => {
        let _results = [...results];
        const index = _results.findIndex(
            (r) => (r.criterion as Criterion)._id === (saved.criterion as Criterion)._id
        );
        if (index !== -1) {
            _results[index] = { ...saved };
        } else {
            _results.push({ ...saved });
        }
        setResults(_results);
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

    const calculateTotalWeight = () => {
        return results.reduce((sum, r) => {
            const criterion = r.criterion as Criterion;
            return sum + (criterion?.weight || 0);
        }, 0);
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

    const actionBodyTemplate = (rowData: Result) => {
        if (!canEdit) return null;
        return (
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
    };

    const endToolbarTemplate = () => (
        <div className="my-2">
            <Button label="Submit" icon="pi pi-check" outlined severity="success" />
        </div>
    );

    return (
        <div className="card">
            {canEdit && <Toolbar className="mb-4" end={endToolbarTemplate} />}
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
                <Column field="criterion.title" header="Criterion" sortable footer={<strong>Weight: {calculateTotalWeight()}</strong>} />
                <Column field="criterion.weight" header="Weight" sortable />
                <Column body={scoreTemplate} header="Score" sortable footer={<strong>Score: {calculateTotalScore()}</strong>} />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: "10rem" }} style={{ display: canEdit ? undefined : "none" }} />
            </DataTable>
            {
                (canEdit && selectedResult) &&
                <SaveResultDialog
                    visible={showAddDialog}
                    result={selectedResult}
                    onCompelete={onSaveComplete}
                    onHide={hideDialogs}
                />
            }
            {
                (canEdit && selectedResult) &&
                <ConfirmDialog
                    showDialog={showDeleteDialog}
                    title={`result of ${(selectedResult.criterion as Criterion).title}`}
                    onConfirmAsync={deleteResult}
                    onHide={hideDialogs}
                />
            }
        </div>
    );
};

export default ResultManager;
