import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { Reviewer, ReviewerStatus } from "../../reviewers/models/reviewer.model";
import { ResultApi } from "../api/result.api";
import { Result } from "../models/result.model";
import SaveResultDialog from "./SaveResultDialog";
import { Criterion, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import { Option } from "@/app/(main)/evaluations/models/option.model";
import { CriterionApi } from "@/app/(main)/evaluations/api/criterion.api";
import { ProjectStage } from "../../stages/models/stage.model";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import ErrorComponent from "@/components/ErrorComponent";
import { Skeleton } from "primereact/skeleton";

interface ResultManagerProps {
    reviewer?: Reviewer;
    updateReviewerStatus?: (reviewer: Reviewer, nextStatus: ReviewerStatus) => Promise<void>;
}

const ResultManager = ({ reviewer, updateReviewerStatus }: ResultManagerProps) => {


    const { getLinkedApplicant } = useAuth();
    const applicant = getLinkedApplicant();
    const loggedApplicantId = applicant?._id ?? applicant;
    const isOwner = (reviewer?.applicant as any)._id === loggedApplicantId;
    const isActiveReviewer = isOwner && reviewer?.status === ReviewerStatus.active;
    const confirm = useConfirmDialog();

    const [results, setResults] = useState<Result[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedResult, setSelectedResult] = useState<Result | null>(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
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
            } catch (err: Error | any) {
                setError("Failed to fetch reviewers." + (err.message || ""));
            }
            finally { setLoading(false); }
        };
        fetchData();
    }, [reviewer]);

    if (loading) {
        return (
            <div className="p-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center mb-3">
                        <Skeleton width="50px" height="2rem" className="mr-2" />
                        <Skeleton width="200px" height="2rem" className="mr-2" />
                        <Skeleton width="80px" height="2rem" className="mr-2" />
                        <Skeleton width="100px" height="2rem" className="mr-2" />
                        <Skeleton width="120px" height="2rem" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <ErrorComponent errorMessage={error} />
        );
    }

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
        hideSaveDialog();
    };

    const deleteResult = async (row: Result) => {
        const deleted = await ResultApi.deleteResult(row);
        if (deleted) {
            setResults(results.map(r =>
                (r.criterion as Criterion)._id === (row.criterion as Criterion)._id
                    ? { ...r, _id: undefined, score: 0, selectedOption: undefined } // reset instead of removing
                    : r
            ));
            // hideDialogs();
        }
    };

    const hideSaveDialog = () => {
        setSelectedResult(null);
        setShowSaveDialog(false);
        //setShowDeleteDialog(false);
    };

    const calculateTotalWeight = () => {
        return results.reduce((sum, r) => {
            const criterion = r.criterion as Criterion;
            return sum + (criterion?.weight || 0);
        }, 0);
    };

    const calculateTotalScore = () => {
        return results.reduce((sum, r) => {
            return sum + (r.score ?? 0);
        }, 0);
    };


    const scoreTemplate = (rowData: Result) => {
        const criterion = rowData.criterion as Criterion;
        if (!criterion) return "";
        if (criterion.form_type === FormType.closed) {
            const opt = rowData.selectedOption as Option;
            return opt
                ? opt.title + " (" + opt.score + ")"
                : "-";
        }
        return rowData.score ?? "-";
    };

    const actionBodyTemplate = (rowData: Result) => {
        if (!isActiveReviewer) return null;
        return (
            <>
                <Button
                    icon="pi pi-pencil"
                    rounded
                    severity="success"
                    className="p-button-rounded p-button-text"
                    onClick={() => {
                        setSelectedResult(rowData);
                        setShowSaveDialog(true);
                    }}
                />
                {rowData._id && (
                    <Button
                        icon="pi pi-times"
                        rounded
                        severity="warning"
                        className="p-button-rounded p-button-text"
                        onClick={() => {
                            confirm.ask({
                                item: `result of ${(rowData.criterion as Criterion).title}`,
                                onConfirmAsync: () => deleteResult(rowData)
                            });
                        }}
                    />
                )}
            </>
        );
    };

    const endToolbarTemplate = () => {
        const s = reviewer?.status;
        return (
            <div className="my-2">
                {/* active → submitted */}
                {s === ReviewerStatus.active && (
                    <Button label="Submit" icon="pi pi-check" outlined severity="success"
                        onClick={() => {
                            if (!reviewer || !updateReviewerStatus) return;
                            confirm.ask({
                                operation: 'submit',
                                onConfirmAsync: () => updateReviewerStatus(reviewer, ReviewerStatus.submitted)
                            });
                        }}
                    />
                )}
                {/* submitted → active */}
                {s === ReviewerStatus.submitted && (
                    <Button label="Recall Submission" icon="pi pi-arrow-left" outlined severity="warning"
                        onClick={() => {
                            if (!reviewer || !updateReviewerStatus) return;
                            confirm.ask({
                                operation: 'Recall Submission',
                                onConfirmAsync: () => updateReviewerStatus(reviewer, ReviewerStatus.active)
                            });
                        }}
                    />
                )}

            </div>
        )
    };

    return (
        <div className="card">
            {isOwner && <Toolbar className="mb-4" end={endToolbarTemplate} />}
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
            //tableStyle={{ minWidth: "50rem" }}
            >
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: "50px" }} />
                <Column field="criterion.title" header="Criterion" sortable footer={<strong>Weight: {calculateTotalWeight()}</strong>} />
                <Column field="criterion.weight" header="Weight" sortable />
                <Column body={scoreTemplate} header="Score" sortable footer={<strong>Score: {calculateTotalScore()}</strong>} />
                <Column field="comment" header="Comment" sortable />
                <Column body={actionBodyTemplate} style={{ display: isActiveReviewer ? undefined : "none" }} />
            </DataTable>
            {
                (isActiveReviewer && selectedResult) &&
                <SaveResultDialog
                    visible={showSaveDialog}
                    result={selectedResult}
                    onCompelete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            }

        </div>
    );
};

export default ResultManager;
