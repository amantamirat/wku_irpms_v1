'use client';

import { User } from "@/app/(main)/users/models/user.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useMemo, useState } from "react";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator } from "../models/collaborator.model";
import { COLLAB_STATUS_ORDER, COLLAB_TRANSITIONS } from "../models/collaborator.state-machine";
import ProjectDetail from "../../projects/components/ProjectDetail";


interface CollaboratorManagerProps {
    user: User;
}

const CollaboratorManager = ({ user }: CollaboratorManagerProps) => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState<boolean>(false);


    useEffect(() => {
        const fetchCollaborators = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await CollaboratorApi.getAll({ member: user }, true);
                setCollaborators(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching collaborators", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborators();
    }, [user]);

    // useMemo prevents component re-creation on every render cycle
    const Manager = useMemo(() => {
        return createEntityManager<Collaborator>({
            //title: "Evaluations",
            itemName: "Collaborator",
            api: CollaboratorApi,
            columns: [
                {
                    header: "Project Title",
                    field: "project.title",
                    body: (r: Collaborator, options: any) => {
                        const title = typeof r.project === "object" ? r.project.title : "Unknown Project";
                        return <div className="truncate text-sm font-medium" title={title}
                            style={{ maxWidth: "350px" }}
                        >{title}</div>;

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
                    header: "Lead",
                    field: "project.leadPI.name",
                    sortable: true,
                    body: (c: Collaborator) => {
                        const lead = typeof c.project === "object" ? c.project?.leadPI : null;
                        return (
                            <div>
                                {(lead as any)?.name ?? "Loading..."}
                            </div>
                        );
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
            items: collaborators,
            workflow: {
                statusField: "status",
                statusOrder: COLLAB_STATUS_ORDER,
                transitions: COLLAB_TRANSITIONS
            },
            permissionPrefix: "collaborator",
            hideSearch: true,
            hideDefaultActions: true,
            expandable: {
                template: (collaborator) => {
                    // Extracts the string ID whether project is an object or already a string ID
                    const projectId = typeof collaborator?.project === 'object'
                        ? collaborator.project?._id
                        : collaborator?.project;
                    if (!projectId) return <div className="p-3 text-500">No project ID found.</div>;
                    return <ProjectDetail project={projectId} />;
                }
            }
        });
    }, [collaborators]);

    if (loading) {
        return <div className="p-4 text-center">Loading projects...</div>;
    }

    return <Manager />;
};

export default CollaboratorManager;