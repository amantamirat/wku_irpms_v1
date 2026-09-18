'use client';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useMemo, useState } from "react";
import { Application } from "../../applications/models/application.model";
import { Verification } from "../../verifications/models/verification.model";
import { ReviewerApi } from "../api/reviewer.api";
import EvaluationDialog from "../components/EvaluationDialog";
import SaveReviewerDialog from "../components/SaveReviewerDialog";
import { FilterReviewersOptions, Reviewer, ReviewerStatus, ReviewerTargetType } from "../models/reviewer.model";
import { REVIEWER_ADMIN_TRANSITIONS } from "../models/reviewer.state-machine";
import { RowActionButton } from "@/components/data-table/ItemDataTable";
import { useAuth } from "@/contexts/auth-context";

interface ReviewerManagerProps {
    targetType: ReviewerTargetType,
    application?: Application;
    verification?: Verification;
}


const ReviewerManager = ({ targetType, application, verification }: ReviewerManagerProps) => {


    const { hasPermission } = useAuth();
    const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);

    // Simple close handler without re-fetching API
    const handleCloseDialog = () => {
        setSelectedReviewer(null);
    };

    const rowActions: RowActionButton<Reviewer>[] = [
        {
            icon: 'pi pi-eye',
            severity: 'secondary',
            tooltip: 'Start/View Evaluation',
            visible: () => { return hasPermission("result:read") },
            disabled: reviewer =>
                (reviewer.status === ReviewerStatus.pending || reviewer.status === ReviewerStatus.decliend),
            onClick: reviewer => {
                setSelectedReviewer(reviewer);
            }
        }
    ];

    const Manager = useMemo(() => {
        return createEntityManager<Reviewer, FilterReviewersOptions>({
            title: "Reviewers",
            itemName: "Reviewer",
            api: ReviewerApi,
            query: () => ({
                targetType,
                application,
                verification
            }),
            createNew: () => ({
                targetType: targetType,
                application,
                verification,
                weight: 1,
                status: ReviewerStatus.pending
            }),

            SaveDialog: SaveReviewerDialog,
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
            extraRowActions: rowActions
        });
    }, [application, verification, setSelectedReviewer]);

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

export default ReviewerManager;