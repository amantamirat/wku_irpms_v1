'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Application, ApplicationStatus } from "../../applications/models/application.model";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus, ReviewerTargetType } from "../models/reviewer.model";
import MyBadge from "@/templates/MyBadge";
import SaveReviewerDialog from "../components/SaveReviewerDialog";
import { REVIEWER_ADMIN_TRANSITIONS, REVIEWER_STATUS_ORDER } from "../models/reviewer.state-machine";
import EvaluationDialog from "../components/EvaluationDialog";

interface ReviewerManagerProps {
    application: Application;
}

const ApplicationReviewerManager = ({ application }: ReviewerManagerProps) => {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    
    // State to hold the reviewer selected for viewing
    const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);

    const canManage = useMemo(() => application && (
        application.status === ApplicationStatus.pending
    ), [application?.status]);

    const fetchReviewers = useCallback(async () => {
        if (!application) return;
        setLoading(true);
        try {
            const data = await ReviewerApi.getAll({ 
                targetType: ReviewerTargetType.APPLICATION,
                application 
            }, true);
            setReviewers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching reviewers for application:", error);
        } finally {
            setLoading(false);
        }
    }, [application]);

    useEffect(() => {
        fetchReviewers();
    }, [fetchReviewers]);

    // Simple close handler without re-fetching API
    const handleCloseDialog = () => {
        setSelectedReviewer(null);
    };

    const Manager = useMemo(() => {
        return createEntityManager<Reviewer>({
            title: "Reviewers",
            itemName: "Reviewer",
            api: ReviewerApi,
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
                transitions: REVIEWER_ADMIN_TRANSITIONS
            },
            permissionPrefix: "reviewer",
            extraActions: [
                {
                    icon: "pi pi-eye",
                    severity: "secondary",
                    tooltip: "View Evaluation",
                    disabled: (row: Reviewer) => row.status === ReviewerStatus.pending,
                    onClick: (row: Reviewer) => {
                        setSelectedReviewer(row);
                    }
                }
            ],
            hideSearch: true,
        });
    }, [reviewers, canManage, application,setSelectedReviewer]);

    if (loading) {
        return <div className="p-4 text-center">Loading reviewers...</div>;
    }

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