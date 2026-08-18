'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useMemo, useState } from "react";
import { Project, ProjectStatus } from "../../projects/models/project.model";
import { CollaboratorApi } from "../api/collaborator.api";
import SaveCollaborator from "../components/SaveCollaborator";
import { Collaborator, CollaboratorStatus } from "../models/collaborator.model";


interface CollaboratorManagerProps {
    project: Project;
    enableEditing?: boolean;
}

const CollaboratorManager = ({ project, enableEditing }: CollaboratorManagerProps) => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const canManage = useMemo(() => (
        enableEditing &&
        (project.status === ProjectStatus.draft ||
        project.status === ProjectStatus.approved)
    ), [project.status, enableEditing]);
    


    useEffect(() => {
        const fetchCollaborators = async () => {
            if (!project) return;
            setLoading(true);
            try {
                const data = await CollaboratorApi.getAll({ project: project }, true);
                setCollaborators(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching collaborators", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborators();
    }, [project]);

    // useMemo prevents component re-creation on every render cycle
    const Manager = useMemo(() => {
        return createEntityManager<Collaborator>({
            //title: "Evaluations",
            itemName: "Collaborator",
            api: CollaboratorApi,
            columns: [
                {
                    header: "Collaborator Name",
                    field: "collaborator.name",
                    body: (r: Collaborator, options: any) => {
                        return (r.member as any)?.name || "N/A";
                    }
                },
                {
                    field: "role",
                    header: "Role",
                    sortable: true,
                    body: (c: Collaborator) => (
                        <span>{c.role || "No Role Assigned"}</span>
                    )
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
            items: collaborators,
            permissionPrefix: "collaborator",
            createNew: canManage
                ? () => ({
                    project: project,
                    isLeadPI: false,
                    status: CollaboratorStatus.pending
                })
                : undefined,
            SaveDialog: canManage ? SaveCollaborator : undefined,
            hideSearch: true,
            hideDefaultActions: true,
        });
    }, [collaborators]);

    if (loading) {
        return <div className="p-4 text-center">Loading collaborators...</div>;
    }

    return <Manager />;
};

export default CollaboratorManager;