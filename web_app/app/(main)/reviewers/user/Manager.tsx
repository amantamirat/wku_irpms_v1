'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { User } from "../../users/models/user.model";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus, ReviewerTargetType } from "../models/reviewer.model";
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
                enableEvaluation={enableEvaluation}
                onClose={handleCloseDialog}
            />
        </>
    );
};

export default ReviewerManager;