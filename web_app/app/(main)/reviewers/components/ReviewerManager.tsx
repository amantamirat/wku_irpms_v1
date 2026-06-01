'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { Dialog } from "primereact/dialog";
import { useMemo, useState } from "react";

import { User } from "@/app/(main)/users/models/user.model";
import { ProjectApplication, ApplicationStatus } from "../../projects/applications/models/project.application.model";
import { ReviewerApi } from "../api/reviewer.api";
import { GetReviewersOptions, Reviewer, ReviewerStatus } from "../models/reviewer.model";
import { REVIEWER_STATUS_ORDER, REVIEWER_TRANSITIONS } from "../models/reviewer.state-machine";

import EvaluatorManager from "../results/components/evaluator/EvaluatorManager";
import SaveReviewerDialog from "./SaveReviewerDialog";

interface ReviewerManagerProps {
    projectStage?: ProjectApplication;
    reviewer?: User;
    status?: ReviewerStatus | ReviewerStatus[];
    reviewers?: Reviewer[];
    onItemsChange?: (items: Reviewer[]) => void;
    hideSearch?: boolean;
    hideReviewer?: boolean;
}

const ReviewerManager = ({
    projectStage,
    reviewer,
    status,
    reviewers,
    onItemsChange,
    hideSearch,
    hideReviewer,
}: ReviewerManagerProps) => {

    const canManage = useMemo(() => projectStage && (
        projectStage.status === ApplicationStatus.submitted
    ), [projectStage?.status]);

    const { getUser } = useAuth();
    const activeUser = getUser();

    const [activeEvaluation, setActiveEvaluation] = useState<{
        reviewer: Reviewer;
        canEvaluate: boolean;
    } | null>(null);

    const [loadingEval, setLoadingEval] = useState(false);

    const startEvaluation = async (reviewer: Reviewer, canEvaluate: boolean) => {
        try {
            setLoadingEval(true);
            setActiveEvaluation({ reviewer, canEvaluate });
        } finally {
            setLoadingEval(false);
        }
    };

    const columns = useMemo(() => {
        const cols: any[] = [];

        if (!reviewer) {
            cols.push({
                header: "Reviewer",
                field: "reviewer.name",
                body: (r: Reviewer, options: any) => {
                    if (hideReviewer) {
                        return `Reviewer ${options.rowIndex + 1}`;
                    }

                    return (r.reviewer as any)?.name || "N/A";
                }
            });
        }

        if (!projectStage) {
            cols.push({
                header: "Project",
                field: "projectStage.project.title",
                sortable: true,
                body: (r: Reviewer) => (
                    <div className="truncate text-sm" style={{ maxWidth: '250px' }}>
                        <span className="mr-1">
                            {(r.projectStage as any)?.project?.title || "-"}
                        </span>
                        {(r.projectStage as any)?.grantStage?.name && (
                            <span className="text-gray-500">
                                [{(r.projectStage as any)?.grantStage?.name}]
                            </span>
                        )}
                    </div>
                )
            });
        }

        cols.push(
            {
                header: "Score",
                field: "score",
                body: (r: Reviewer) =>
                    [ReviewerStatus.submitted, ReviewerStatus.approved].includes(r.status)
                        ? r.score ?? "N/A"
                        : "N/A"
            },
            {
                header: "Status",
                field: "status",
                sortable: true,
                body: (r: Reviewer) => (
                    <MyBadge type="status" value={r.status ?? "Unknown"} />
                )
            }
        );

        return cols;
    }, [projectStage, reviewer, activeUser?._id, loadingEval, activeEvaluation]);

    const query = useMemo(() => ({
        reviewer: reviewer?._id,
        projectStage: projectStage?._id,
        status,
        populate: true
    }), [reviewer?._id, projectStage?._id, status]);

    const Manager = useMemo(() =>
        createEntityManager<Reviewer, GetReviewersOptions>({
            title: "Evaluations",
            itemName: "Reviewer",
            api: ReviewerApi,
            columns,
            // --- ADDED THIS ---
            items: reviewers, // 👈 Passes the static list if defined
            // ------------------
            onItemsChange,

            createNew: canManage
                ? (): Reviewer => ({
                    projectStage,
                    reviewer: reviewer ?? undefined,
                    weight: 1,
                    status: ReviewerStatus.pending
                })
                : undefined,

            SaveDialog: canManage ? SaveReviewerDialog : undefined,
            permissionPrefix: "reviewer",

            query: () => query,

            workflow: {
                statusField: "status",
                statusOrder: REVIEWER_STATUS_ORDER,
                transitions: REVIEWER_TRANSITIONS
            },
            extraActions: [
                {
                    icon: "pi pi-eye",
                    severity: "secondary",
                    tooltip: "Start/View Evaluation",
                    disabled: (row: Reviewer) =>
                        row.status === ReviewerStatus.pending,
                    onClick: (row: Reviewer) => {
                        const reviewerAppId =
                            typeof row.reviewer === "string"
                                ? row.reviewer
                                : row.reviewer?._id;
                        const canEvaluate = reviewerAppId === activeUser?._id &&
                            row.status === ReviewerStatus.accepted;
                        startEvaluation(row, canEvaluate);
                    }
                },
            ],
            hideDefaultActions: !projectStage,
            disableDeleteRow: (row: Reviewer) =>
                row.status !== ReviewerStatus.pending,
            hideSearch
        }),
        // Added reviewers to the dependency array
        [columns, projectStage?._id, reviewer?._id, status, query]
    );

    return (
        <>
            <Manager />

            <Dialog
                visible={!!activeEvaluation}
                maximized
                onHide={() => setActiveEvaluation(null)}
                header={`Evaluating: ${(activeEvaluation?.reviewer.projectStage as any)?.project?.title || 'Proposal'}`}
                pt={{
                    root: { className: 'surface-ground' },
                    content: { className: 'p-0' }
                }}
            >
                {activeEvaluation && (
                    <EvaluatorManager
                        reviewer={activeEvaluation.reviewer}
                        canEvaluate={activeEvaluation.canEvaluate}
                        onClose={() => setActiveEvaluation(null)}
                    />
                )}
            </Dialog>
        </>
    );
};

export default ReviewerManager;