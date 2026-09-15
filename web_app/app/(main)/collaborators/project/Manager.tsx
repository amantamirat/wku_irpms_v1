'use client';

import MyBadge from "@/templates/MyBadge";
import { useEffect, useState } from "react";
import { Project } from "../../projects/models/project.model";
import { CollaboratorApi } from "../api/collaborator.api";
import SaveCollaborator from "../components/SaveCollaborator";
import {
    Collaborator,
    CollaboratorStatus
} from "../models/collaborator.model";
import { createEntityManager } from "@/components/data-table/createEntityManager";

interface CollaboratorManagerProps {
    project: Project;
    enableEditing?: boolean;
}

const CollaboratorManager = ({
    project,
    enableEditing
}: CollaboratorManagerProps) => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    /*
    const canManage =
        enableEditing &&
        (
            project.status === ProjectStatus.draft ||
            project.status === ProjectStatus.approved
        );
    */

    useEffect(() => {
        const fetchCollaborators = async () => {
            if (!project) return;

            setLoading(true);

            try {
                const data = await CollaboratorApi.lookup!({
                    project: project
                });

                setCollaborators(
                    Array.isArray(data) ? data : []
                );
            } catch (error) {
                console.error(
                    "Error fetching collaborators",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborators();
    }, [project]);

    const Manager = createEntityManager<Collaborator>({
        itemName: "Collaborator",
        api: CollaboratorApi,

        columns: [
            {
                header: "Collaborator Name",
                field: "collaborator.name",
                body: (r: Collaborator) => {
                    return (r.member as any)?.name || "N/A";
                }
            },
            {
                field: "role",
                header: "Role",
                sortable: true,
                body: (c: Collaborator) => (
                    <span>
                        {c.role || "No Role Assigned"}
                    </span>
                )
            },
            {
                header: "Status",
                field: "status",
                sortable: true,
                body: (r: Collaborator) => (
                    <MyBadge
                        type="status"
                        value={r.status ?? "Unknown"}
                    />
                )
            }
        ],

        items: collaborators,

        permissionPrefix: "collaborator",

        createNew: () => ({
            project,
            isLeadPI: false,
            status: CollaboratorStatus.pending
        }),

        SaveDialog: SaveCollaborator,

        hideSearch: true,
        hideEditAction: true,
    });

    if (loading) {
        return (
            <div className="p-4 text-center">
                Loading collaborators...
            </div>
        );
    }

    return <Manager />;
};

export default CollaboratorManager;