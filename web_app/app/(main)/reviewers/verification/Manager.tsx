'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Verification, VerificationStatus } from "../../verifications/models/verification.model";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus, ReviewerTargetType } from "../models/reviewer.model";
import MyBadge from "@/templates/MyBadge";
import SaveReviewerDialog from "../components/SaveReviewerDialog";
import { REVIEWER_ADMIN_TRANSITIONS, REVIEWER_STATUS_ORDER } from "../models/reviewer.state-machine";
import EvaluationDialog from "../components/EvaluationDialog";

interface VerificationReviewerManagerProps {
    verification: Verification;
}

const VerificationReviewerManager = ({ verification }: VerificationReviewerManagerProps) => {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    // State to hold the reviewer selected for viewing
    const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);

    // Adjust management rules based on your Verification workflow state
    const canManage = useMemo(() => verification && (
        verification.status === VerificationStatus.submitted
    ), [verification?.status]);

    const fetchReviewers = useCallback(async () => {
        if (!verification) return;
        setLoading(true);
        try {
            const data = await ReviewerApi.getAll({
                targetType: ReviewerTargetType.VERIFICATION,
                verification: verification
            }, true);
            setReviewers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching reviewers for verification:", error);
        } finally {
            setLoading(false);
        }
    }, [verification]);

    useEffect(() => {
        fetchReviewers();
    }, [fetchReviewers]);

    const handleCloseDialog = () => {
        setSelectedReviewer(null);
    };

    const Manager = useMemo(() => {
        return createEntityManager<Reviewer>({
            title: "Verification Reviewers",
            itemName: "Reviewer",
            api: ReviewerApi,
            createNew: canManage
                ? (): Reviewer => ({
                    targetType: ReviewerTargetType.VERIFICATION,
                    verification: verification,
                    //project: verification?.project,
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
            disableDeleteRow: (r) => r.status !== ReviewerStatus.pending
        });
    }, [reviewers, canManage, verification]);

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

export default VerificationReviewerManager;