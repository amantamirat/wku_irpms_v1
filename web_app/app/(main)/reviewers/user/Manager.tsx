'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { User } from "../../users/models/user.model";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus } from "../models/reviewer.model";
import { REVIEWER_STATUS_ORDER, REVIEWER_USER_TRANSITIONS } from "../models/reviewer.state-machine";
import EvaluationDialog from "../components/EvaluationDialog";


interface ReviewerManagerProps {
    user: User;
    enableEvaluation?: boolean;
}

const ReviewerManager = ({ user, enableEvaluation }: ReviewerManagerProps) => {

    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);

    const fetchReviewers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await ReviewerApi.getAll({ reviewer: user }, true);
            setReviewers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching reviewers", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchReviewers();
    }, [fetchReviewers]);

    const handleCloseDialog = () => {
        setSelectedReviewer(null);
        fetchReviewers(); // Refresh table state on dialog close
    };

    const Manager = useMemo(() => {
        return createEntityManager<Reviewer>({
            title: "Evaluations",
            itemName: "Reviewer",
            api: ReviewerApi,
            columns: [
                {
                    header: "Application",
                    field: "application.project.title",
                    body: (reviewer: Reviewer, options: any) => {
                        const title = typeof reviewer.application === "object" &&
                            reviewer.application && "project" in reviewer.application &&
                            typeof reviewer.application.project === "object" ?
                            reviewer.application.project.title : "Unknown Project";

                        const name = typeof reviewer.application === "object" &&
                            reviewer.application && "stage" in reviewer.application &&
                            typeof reviewer.application.stage === "object" ?
                            reviewer.application.stage.name : "Unknown Stage";

                        return (
                            <div className="truncate text-sm font-medium" title={title}>
                                {title}
                                <span className="text-gray-500"> [{name}]</span>
                            </div>
                        );
                    }
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
            items: reviewers,
            workflow: {
                statusField: "status",
                statusOrder: REVIEWER_STATUS_ORDER,
                transitions: REVIEWER_USER_TRANSITIONS
            },
            permissionPrefix: "reviewer",
            extraActions: [
                {
                    icon: "pi pi-eye",
                    severity: "secondary",
                    tooltip: "Start/View Evaluation",
                    disabled: (row: Reviewer) => row.status === ReviewerStatus.pending,
                    onClick: (row: Reviewer) => {
                        setSelectedReviewer(row);
                    }
                },
            ],
            hideSearch: true,
            hideDefaultActions: true,
        });
    }, [reviewers]);

    if (loading) {
        return <div className="p-4 text-center">Loading reviewers...</div>;
    }

    return (
        <>
            <Manager />

            
            <EvaluationDialog
                reviewer={selectedReviewer}
                enableEvaluation={enableEvaluation}
                onClose={handleCloseDialog}
            />
        </>
    );
};

export default ReviewerManager;