'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { ReviewerApi } from "../api/reviewer.api";
import { GetReviewersOptions, Reviewer, ReviewerStatus } from "../models/reviewer.model";
import SaveReviewerDialog from "./SaveReviewerDialog";
import MyBadge from "@/templates/MyBadge";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { ProjectStage } from "../../projects/stages/models/project.stage.model";
import { REVIEWER_STATUS_ORDER, REVIEWER_TRANSITIONS } from "../models/reviewer.state-machine";
import ResultManager from "../results/components/ResultManager";
import { useAuth } from "@/contexts/auth-context";
import { ResultApi } from "../results/api/result.api";
import { useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import EvaluatorManager from "../results/components/evaluator/EvaluatorManager";

interface ReviewerManagerProps {
    projectStage?: ProjectStage;
    applicant?: Applicant;
}

const ReviewerManager = ({ projectStage, applicant }: ReviewerManagerProps) => {

    const [activeEvaluation, setActiveEvaluation] = useState<{
        reviewer: Reviewer;
        results: any[];
        criteria: any[];
    } | null>(null);
    const [loadingEval, setLoadingEval] = useState(false);

    // Function to launch the new Evaluator UI
    const startEvaluation = async (reviewer: Reviewer) => {
        try {
            setLoadingEval(true);
            // Fetch populated results as you described
            const res = await ResultApi.getAll({
                reviewer: reviewer._id!,
                populate: true
            });

            // Extract unique criteria from the populated results
            const criteria = res.map((r: any) => r.criterion);

            setActiveEvaluation({
                reviewer,
                results: res,
                criteria
            });
        } catch (err) {
            console.error("Failed to load evaluation", err);
        } finally {
            setLoadingEval(false);
        }
    };

    const columns: any[] = [];

    const { getApplicant } = useAuth();
    const user = getApplicant();


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
            body: (r: Reviewer) =>
                (r.projectStage as any)?.project?.title || "-"
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
            const canEvaluate = [ReviewerStatus.accepted, ReviewerStatus.pending].includes(row.status);
            return (
                <Button
                    icon="pi pi-pencil"
                    label={row.status === ReviewerStatus.submitted ? "View" : "Evaluate"}
                    className="p-button-text p-button-sm"
                    loading={loadingEval && activeEvaluation?.reviewer._id === row._id}
                    onClick={() => startEvaluation(row)}
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
        expandable: {
            template: (reviewer) => (
                <ResultManager reviewer={reviewer} />
            )
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
                        initialCriteria={activeEvaluation.criteria}
                        initialResults={activeEvaluation.results}
                        onClose={() => setActiveEvaluation(null)} // Add a close callback
                    />
                )}
            </Dialog>
        </>
    );
};

export default ReviewerManager;