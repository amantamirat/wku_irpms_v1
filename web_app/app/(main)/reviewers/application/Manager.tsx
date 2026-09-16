'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import { Application, ApplicationStatus } from "../../applications/models/application.model";
import { ReviewerApi } from "../api/reviewer.api";
import { FilterReviewersOptions, Reviewer, ReviewerStatus, ReviewerTargetType } from "../models/reviewer.model";
import MyBadge from "@/templates/MyBadge";
import SaveReviewerDialog from "../components/SaveReviewerDialog";
import EvaluationDialog from "../components/EvaluationDialog";
import { createEntityManager } from "@/components/data-table/createEntityManager";
import { REVIEWER_ADMIN_TRANSITIONS, REVIEWER_TRANSITIONS } from "../models/reviewer.state-machine";

interface ReviewerManagerProps {
    application: Application;
}

const ApplicationReviewerManager = ({ application }: ReviewerManagerProps) => {


    const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);

    const canManage = application.status === ApplicationStatus.pending;

    // Simple close handler without re-fetching API
    const handleCloseDialog = () => {
        setSelectedReviewer(null);
    };

    let extraActions = [
        {
            icon: "pi pi-eye",
            severity: "secondary",
            tooltip: "View Evaluation",
            disabled: (row: Reviewer) => row.status === ReviewerStatus.pending,
            onClick: (row: Reviewer) => {
                setSelectedReviewer(row);
            }
        }
    ]

    const Manager = useMemo(() => {
        return createEntityManager<Reviewer, FilterReviewersOptions>({
            title: "Reviewers",
            itemName: "Reviewer",
            api: ReviewerApi,
            query: () => ({
                targetType: ReviewerTargetType.APPLICATION,
                application
            }),
            createNew: canManage
                ? (): Reviewer => ({
                    targetType: ReviewerTargetType.APPLICATION,
                    application: application,
                    weight: 1,
                    status: ReviewerStatus.pending
                })
                : undefined,

            SaveDialog: canManage ? SaveReviewerDialog : undefined,
            columns: [
                {
                    header: "Reviewer Name",
                    field: "reviewer.name",
                    body: (r: Reviewer) => (r.reviewer as any)?.name || "N/A"
                },
                {
                    header: "Score",
                    field: "reviewer.score",
                    body: (r: Reviewer) => r.score || "N/A"
                },
                {
                    header: "Status",
                    field: "status",
                    sortable: true,
                    body: (r: Reviewer) => (
                        <MyBadge type="status" value={r.status ?? "Unknown"} />
                    )
                }
            ],
            workflow: {
                statusField: "status",
                transitions: REVIEWER_ADMIN_TRANSITIONS
            },
            permissionPrefix: "reviewer",
            hideSearch: true,
        });
    }, [canManage, application, setSelectedReviewer]);

    return (
        <>
            <Manager />
            <EvaluationDialog
                reviewer={selectedReviewer}
                enableEvaluation={false} // Read-only view mode
                onClose={handleCloseDialog}
            />
        </>
    );
};

export default ApplicationReviewerManager;