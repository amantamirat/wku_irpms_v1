'use client';

import { User } from "@/app/(main)/users/models/user.model";
import { createEntityManager } from "@/components/createEntityManager";
import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useState } from "react";
import { ProjectStage } from "../../projects/stages/models/project.stage.model";
import { ReviewerApi } from "../api/reviewer.api";
import { GetReviewersOptions, Reviewer, ReviewerStatus } from "../models/reviewer.model";
import { REVIEWER_STATUS_ORDER, REVIEWER_TRANSITIONS } from "../models/reviewer.state-machine";
import EvaluatorManager from "../results/components/evaluator/EvaluatorManager";
import SaveReviewerDialog from "./SaveReviewerDialog";

interface ReviewerManagerProps {
    projectStage?: ProjectStage;
    applicant?: User;
}

const ReviewerManager = ({ projectStage, applicant }: ReviewerManagerProps) => {

    const [activeEvaluation, setActiveEvaluation] = useState<{
        reviewer: Reviewer;
        canEvaluate: boolean;
    } | null>(null);
    const [loadingEval, setLoadingEval] = useState(false);

    const { getApplicant } = useAuth();
    const activeUser = getApplicant();



    // Function to launch the new Evaluator UI
    const startEvaluation = async (reviewer: Reviewer, canEvaluate: boolean) => {
        try {
            setLoadingEval(true);
            setActiveEvaluation({ reviewer, canEvaluate });
        } catch (err) {
            console.error("Failed to load evaluation", err);
        } finally {
            setLoadingEval(false);
        }
    };



    const columns: any[] = [];


    // Column: Stage & Project (when filtering by applicant)
    if (applicant) {
        columns.push({
            header: "Stage",
            field: "projectStage.grantStage.name",
            sortable: true,
            body: (r: Reviewer) =>
                (r.projectStage as any)?.grantStage?.name || "-"
        });

        columns.push({
            header: "Project",
            field: "projectStage.project.title",
            sortable: true,
            style: { width: '250px', maxWidth: '250px' },
            body: (row: Reviewer) => (
                <div
                    className="truncate"
                    style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                //title={row.title}
                >
                    {(row.projectStage as any)?.project?.title || "-"}
                </div>
            ),
        });
    }

    // Column: Reviewer (when filtering by projectStage)
    if (projectStage) {
        columns.push({
            header: "Reviewer",
            field: "applicant.name",
            body: (r: Reviewer) =>
                (r.applicant as any)?.name || "Unknown"
        });
    }

    // Common Columns
    columns.push(
        {
            header: "Score",
            field: "score",
            body: (row: Reviewer) =>
                [ReviewerStatus.submitted, ReviewerStatus.approved].includes(row.status)
                    ? row.score ?? "-"
                    : "-"
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

    // ADD: Action Column for "Evaluate"
    columns.push({
        header: "Actions",
        body: (row: Reviewer) => {

            const reviewerAppId =
                typeof row.applicant === "string"
                    ? row.applicant
                    : row.applicant?._id;
            const canEvaluate = reviewerAppId === activeUser._id &&
                row.status === ReviewerStatus.accepted;

            return (
                <Button
                    icon="pi pi-pencil"
                    label={
                        canEvaluate
                            ? "Evaluate"
                            : "View"
                    }
                    className="p-button-text p-button-sm"
                    loading={
                        loadingEval &&
                        activeEvaluation?.reviewer._id === row._id
                    }
                    onClick={() => startEvaluation(row, canEvaluate)}
                />
            );
        }
    });

    const Manager = createEntityManager<Reviewer, GetReviewersOptions>({
        title: "Reviewers",
        itemName: "Reviewer",
        api: ReviewerApi,
        columns,
        createNew:
            projectStage ? (): Reviewer => ({
                projectStage: projectStage,
                applicant: applicant ?? undefined,
                weight: 1,
                status: ReviewerStatus.pending
            }) : undefined,

        SaveDialog: projectStage ? SaveReviewerDialog : undefined,
        permissionPrefix: "reviewer",

        query: () => ({
            applicant: applicant?._id,
            projectStage: projectStage?._id,
            populate: true
        }),

        workflow: {
            statusField: "status",
            statusOrder: REVIEWER_STATUS_ORDER,
            transitions: REVIEWER_TRANSITIONS
        },
        // Only allow delete if still pending
        disableDeleteRow: (row: Reviewer) =>
            row.status !== ReviewerStatus.pending,
    });

    return (
        <>
            <Manager />

            {/* FULL SCREEN EVALUATOR OVERLAY */}
            <Dialog
                visible={!!activeEvaluation}
                maximized
                onHide={() => setActiveEvaluation(null)}
                header={`Evaluating: ${(activeEvaluation?.reviewer.projectStage as any)?.project?.title || 'Proposal'}`}
                pt={{
                    root: { className: 'surface-ground' }, // Use professional background
                    content: { className: 'p-0' } // Remove padding for custom layout
                }}
            >
                {activeEvaluation && (
                    <EvaluatorManager
                        reviewer={activeEvaluation.reviewer}
                        canEvaluate={activeEvaluation.canEvaluate}
                        onClose={() => setActiveEvaluation(null)} // Add a close callback
                    />
                )}
            </Dialog>
        </>
    );
};

export default ReviewerManager;