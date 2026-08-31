'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus, ReviewerTargetType } from "../models/reviewer.model";
import { REVIEWER_STATUS_ORDER, REVIEWER_USER_TRANSITIONS } from "../models/reviewer.state-machine";
import EvaluationDialog from "../components/EvaluationDialog";

interface MyReviewersManagerProps {
   // enableEvaluation?: boolean;
}

const MyReviewersManager = () => {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);

    const fetchReviewers = useCallback(async () => {
        setLoading(true);
        try {
            // Uses dedicated me endpoint (no user ID param needed)
            const data = await ReviewerApi.me();
            setReviewers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching my evaluations", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviewers();
    }, [fetchReviewers]);

    const handleCloseDialog = () => {
        setSelectedReviewer(null);
        fetchReviewers();
    };

    const Manager = useMemo(() => {
        return createEntityManager<Reviewer>({
            title: "Evaluations",
            itemName: "Reviewer",
            api: ReviewerApi,
            columns: [
                {
                    header: "Project",
                    field: "project.title",
                    body: (r: Reviewer) => {
                        const projectObj = typeof r.project === "object" ? r.project : null;
                        const title = projectObj?.title || "Unknown Project";

                        return (
                            <div className="truncate text-sm font-medium" title={title}>
                                {title}
                            </div>
                        );
                    }
                },
                {
                    header: "Stage",
                    field: "targetType",
                    body: (r: Reviewer) => {
                        const targetType = r.targetType || (r.application ? ReviewerTargetType.APPLICATION : ReviewerTargetType.VERIFICATION);
                        let tagLabel = String(targetType);

                        if (targetType === ReviewerTargetType.APPLICATION) {
                            const stageName = typeof r.application === "object" && typeof r.application?.stage === "object"
                                ? r.application.stage?.name
                                : null;

                            tagLabel = stageName || ReviewerTargetType.APPLICATION;
                        }

                        return (
                            <span className="text-sm text-gray-700 font-medium">
                                {tagLabel}
                            </span>
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
    }, []);

    if (loading) {
        return <div className="p-4 text-center">Loading reviewers...</div>;
    }

    return (
        <>
            <Manager items={reviewers} />

            <EvaluationDialog
                reviewer={selectedReviewer}
                enableEvaluation={true}
                onClose={handleCloseDialog}
            />
        </>
    );
};

export default MyReviewersManager;