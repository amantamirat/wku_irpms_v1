'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useMemo } from "react";
import { ReviewerApi } from "../../reviewers/api/reviewer.api";
import { Reviewer, ReviewerTargetType } from "../../reviewers/models/reviewer.model";
import Link from "next/link";
import { Button } from "primereact/button";

interface ReviewerManagerProps {
    items: Reviewer[];
}

const PendingEvalsManager = ({ items }: ReviewerManagerProps) => {

    const Manager = useMemo(() => {
        return createEntityManager<Reviewer>({
            api: ReviewerApi,
            columns: [
                {
                    header: "Project",
                    field: "project.title",
                    body: (r: Reviewer) => {
                        // 1. Direct project object from reviewer
                        const projectObj = typeof r.project === "object" ? r.project : null;
                        const title = projectObj?.title || "Unknown Project";

                        // 2. Extract target type or fallback
                        const targetType = r.targetType || (r.application ? ReviewerTargetType.APPLICATION : ReviewerTargetType.VERIFICATION);

                        // 3. Determine tag label logic
                        let tagLabel = String(targetType);

                        if (targetType === ReviewerTargetType.APPLICATION) {
                            const stageName = typeof r.application === "object" && typeof r.application?.stage === "object"
                                ? r.application.stage?.name
                                : null;

                            tagLabel = stageName || ReviewerTargetType.APPLICATION;
                        }

                        return (
                            <div className="truncate text-sm font-medium" title={title}>
                                {title}
                                {tagLabel && (
                                    <span className="text-gray-500 ml-1">
                                        [{tagLabel}]
                                    </span>
                                )}
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
            permissionPrefix: "reviewer",
            hideSearch: true,
            hideDefaultActions: true,
        });
    }, []); // Empty dependencies ensure the component reference is never recreated

    if (!items) {
        return <div className="p-4 text-center">No pending evaluations...</div>;
    }

    return (
        <div className="card border-none shadow-1 p-4 mb-4">
            <div className="flex align-items-center justify-content-between mb-4">
                <div>
                    <h5 className="m-0 text-xl font-bold">Pending Evaluations</h5>
                    <p className="text-500 text-sm m-0">Assignments requiring your review</p>
                </div>
                <Link href="dashboard/my-evaluations">
                    <Button label="View All" icon="pi pi-arrow-right" iconPos="right" className="p-button-text p-button-sm" />
                </Link>
            </div>
            <Manager items={items} />
        </div>
    );
};

export default PendingEvalsManager;