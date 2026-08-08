'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { useEffect, useMemo, useState } from "react";
import { Application, ApplicationStatus } from "../../applications/models/application.model";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus } from "../models/reviewer.model";
import MyBadge from "@/templates/MyBadge";
import SaveReviewerDialog from "./SaveReviewerDialog";
import { REVIEWER_ADMIN_TRANSITIONS, REVIEWER_STATUS_ORDER, REVIEWER_TRANSITIONS } from "../models/reviewer.state-machine";


interface ReviewerManagerProps {
    application: Application;
}

const ReviewerManager = ({ application }: ReviewerManagerProps) => {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const canManage = useMemo(() => application && (
        application.status === ApplicationStatus.pending
    ), [application.status]);

    useEffect(() => {
        const fetchReviewers = async () => {
            if (!application) return;
            setLoading(true);
            try {
                const data = await ReviewerApi.getAll({ application }, true);
                setReviewers(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching reviewers for stage:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewers();
    }, [application]);

    // useMemo prevents component re-creation on every render cycle
    const Manager = useMemo(() => {
        return createEntityManager<Reviewer>({
            title: "Reviewers",
            itemName: "Reviewer",
            api: ReviewerApi,
            createNew: canManage
                ? (): Reviewer => ({
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
                    body: (r: Reviewer, options: any) => {
                        return (r.reviewer as any)?.name || "N/A";
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
                transitions: REVIEWER_ADMIN_TRANSITIONS
            },
            permissionPrefix: "reviewer",
            hideSearch: true,
        });
    }, [reviewers]);

    if (loading) {
        return <div className="p-4 text-center">Loading reviewers...</div>;
    }

    return <Manager />;
};

export default ReviewerManager;