'use client';

import { User } from "@/app/(main)/users/models/user.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useMemo, useState } from "react";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator } from "../models/collaborator.model";
import { COLLAB_STATUS_ORDER, COLLAB_TRANSITIONS } from "../models/collaborator.state-machine";
import { Project } from "../../projects/models/project.model";


interface CollaboratorManagerProps {
    project: Project;
}

const CollaboratorManager = ({ project }: CollaboratorManagerProps) => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState<boolean>(false);


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
            workflow: {
                statusField: "status",
                statusOrder: COLLAB_STATUS_ORDER,
                transitions: COLLAB_TRANSITIONS
            },
            permissionPrefix: "collaborator",
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