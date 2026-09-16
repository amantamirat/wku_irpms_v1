'use client';
import { ItemDataTable } from "@/components/data-table/ItemDataTable";
import MyBadge from "@/templates/MyBadge";
import Link from "next/link";
import { Button } from "primereact/button";
import { Reviewer, ReviewerTargetType } from "../../reviewers/models/reviewer.model";


interface MyPendingInvitationProps {
    items: Reviewer[];
}

export function MyPendingEvalsManager({ items }: MyPendingInvitationProps) {


    const columns = [
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
            ),
        },
    ];
    /*
    if (!items || items.length === 0) {
      return (
        <div className="card border-none shadow-1 p-4 mb-4 text-center text-500">
          No pending invitations...
        </div>
      );
    }*/

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

            <ItemDataTable
                items={items}
                columns={columns}
                enableSearch={false}
            />
        </div>
    );
}

export default MyPendingEvalsManager;