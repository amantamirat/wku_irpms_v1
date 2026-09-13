'use client';
import { ItemDataTable } from "@/components/data-table/ItemDataTable";
import MyBadge from "@/templates/MyBadge";
import Link from "next/link";
import { Button } from "primereact/button";
import { Collaborator } from "../../collaborators/models/collaborator.model";

interface MyPendingInvitationProps {
    items: Collaborator[];
}

export function MyPendingInvitation({ items }: MyPendingInvitationProps) {
    

    const columns = [
        {
            header: "Project Title",
            field: "project.title",
            body: (r: Collaborator) => {
                const title =
                    typeof r.project === "object"
                        ? r.project.title
                        : "Unknown Project";
                return (
                    <div className="truncate text-sm font-medium" title={title}>
                        {title}
                    </div>
                );
            },
        },
        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (r: Collaborator) => (
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
                    <h5 className="m-0 text-xl font-bold">Pending Invitations</h5>
                    <p className="text-500 text-sm m-0">
                        Project teams you have been invited to join
                    </p>
                </div>
                <Link href="dashboard/my-memberships">
                    <Button
                        label="View All"
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        className="p-button-text p-button-sm"
                    />
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

export default MyPendingInvitation;