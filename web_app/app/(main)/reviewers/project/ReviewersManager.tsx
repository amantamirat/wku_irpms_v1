'use client';
import { ItemDataTable } from "@/components/data-table/ItemDataTable";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useState } from "react";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerTargetType } from "../models/reviewer.model";

interface ReviewersManagerProps {
    project: string; // Project ID to filter reviewers contextually
}

const ReviewersManager = ({ project }: ReviewersManagerProps) => {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchReviewers = async () => {
            setLoading(true);

            try {
                const data = await ReviewerApi.lookup!({ project });
                setReviewers(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching reviewers", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviewers();
    }, [project]);

    const columns = [
        {
            header: "Evaluator",
            field: "user.name",
            sortable: true,
            body: (reviewer: Reviewer) => {
                const user = typeof reviewer.reviewer === "object" ? reviewer.reviewer : null;
                return (
                    <div className="font-medium text-900">
                        {(user as any)?.name ?? "N/A"}
                    </div>
                );
            }
        },
        {
            header: 'Stage',
            field: 'targetType',
            body: (reviewer: Reviewer) => {
                const targetType =
                    reviewer.targetType ??
                    (reviewer.application ? ReviewerTargetType.APPLICATION : ReviewerTargetType.VERIFICATION);

                if (targetType === ReviewerTargetType.APPLICATION) {
                    const stageName =
                        typeof reviewer.application === 'object' &&
                        typeof reviewer.application?.stage === 'object'
                            ? reviewer.application.stage?.name
                            : null;

                    return (
                        <span className="text-sm text-gray-700 font-medium">
                            {stageName ?? ReviewerTargetType.APPLICATION}
                        </span>
                    );
                }

                return (
                    <span className="text-sm text-gray-700 font-medium">
                        {ReviewerTargetType.VERIFICATION}
                    </span>
                );
            }
        },
        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (reviewer: Reviewer) => (
                <MyBadge type="status" value={reviewer.status ?? "Unknown"} />
            )
        }
    ];

    if (loading) {
        return (
            <div className="p-4 text-center text-500 font-medium">
                Loading evaluators...
            </div>
        );
    }

    return (
        <div className="card border-none shadow-none p-0 mb-2">
            <ItemDataTable
                items={reviewers}
                columns={columns}
                enableSearch={true}
            />
        </div>
    );
};

export default ReviewersManager;