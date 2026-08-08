'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useMemo } from "react";
import { ReviewerApi } from "../../reviewers/api/reviewer.api";
import { Reviewer } from "../../reviewers/models/reviewer.model";
import { REVIEWER_STATUS_ORDER, REVIEWER_USER_TRANSITIONS } from "../../reviewers/models/reviewer.state-machine";
import Link from "next/link";
import { Button } from "primereact/button";

interface ReviewerManagerProps {
    items: Reviewer[];
}

const PendingEvalsManager = ({ items }: ReviewerManagerProps) => {

    const Manager = useMemo(() => {
        return createEntityManager<Reviewer>({
            //title: "Pending Evaluations",
            //itemName: "Reviewer",
            api: ReviewerApi,
            columns: [
                {
                    header: "Application",
                    field: "application.project.title",
                    body: (r: Reviewer, options: any) => {
                        const title = typeof r.application === "object" &&
                            typeof r.application.project === "object" ?
                            r.application.project.title : "Unknown Project";
                        const name = typeof r.application === "object" &&
                            typeof r.application.stage === "object" ?
                            r.application.stage.name : "Unknown Stage";
                        return <div className="truncate text-sm font-medium" title={title}>{title}
                            <span className="text-gray-500">
                                [{name}]
                            </span>
                        </div>;
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
            items: items,
            /*
            workflow: {
                statusField: "status",
                statusOrder: REVIEWER_STATUS_ORDER,
                transitions: REVIEWER_USER_TRANSITIONS
            },*/
            permissionPrefix: "reviewer",
            hideSearch: true,
            hideDefaultActions: true,
        });
    }, [items]);

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
            <Manager />
        </div>
    );
};

export default PendingEvalsManager;