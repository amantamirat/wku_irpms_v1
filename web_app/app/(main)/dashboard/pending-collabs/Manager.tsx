'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import Link from "next/link";
import { Button } from "primereact/button";
import { useMemo } from "react";
import { CollaboratorApi } from "../../collaborators/api/collaborator.api";
import { Collaborator } from "../../collaborators/models/collaborator.model";

interface CollaboratorManagerProps {
    items: Collaborator[];
}

const PendingCollabManager = ({ items }: CollaboratorManagerProps) => {

    const Manager = useMemo(() => {
        return createEntityManager<Collaborator>({
            //title: "Pending Evaluations",
            //itemName: "Collaborator",
            api: CollaboratorApi,
            columns: [
                {
                    header: "Project Title",
                    field: "project.title",
                    body: (r: Collaborator, options: any) => {
                        const title = typeof r.project === "object" ? r.project.title : "Unknown Project";
                        return <div className="truncate text-sm font-medium" title={title}>{title}</div>;

                    }
                },
                {
                    header: "Status",
                    field: "status",
                    sortable: true,
                    body: (r: Collaborator) => (
                        <MyBadge type="status" value={r.status ?? "Unknown"} />
                    )
                }
            ],
            items: items,
            permissionPrefix: "collaborator",
            hideSearch: true,
            hideDefaultActions: true,
        });
    }, [items]);

    if (!items) {
        return <div className="p-4 text-center">No pending invitations...</div>;
    }

    return (
        <div className="card border-none shadow-1 p-4 mb-4">
            <div className="flex align-items-center justify-content-between mb-4">
                <div>
                    <h5 className="m-0 text-xl font-bold">Pending Invitations</h5>
                    <p className="text-500 text-sm m-0">Project teams you have been invited to join</p>
                </div>
                <Link href="dashboard/my-memberships">
                    <Button label="View All" icon="pi pi-arrow-right" iconPos="right" className="p-button-text p-button-sm" />
                </Link>
            </div>
            <Manager />
        </div>
    );
};

export default PendingCollabManager;