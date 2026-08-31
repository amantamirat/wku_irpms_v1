'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator } from "../models/collaborator.model";
import { COLLAB_STATUS_ORDER, COLLAB_TRANSITIONS } from "../models/collaborator.state-machine";
import ProjectDetail from "../../projects/components/ProjectDetail";
import EmptyState from "@/components/EmptyState";

const MyMembershipsManager = () => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchCollaborators = useCallback(async () => {
        setLoading(true);
        try {
            // Uses dedicated me endpoint (no user ID param needed)
            const data = await CollaboratorApi.me();
            setCollaborators(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching my collaborations", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCollaborators();
    }, [fetchCollaborators]);



    const Manager = useMemo(() => {
        return createEntityManager<Collaborator>({
            itemName: "Collaborator",
            api: CollaboratorApi,
            columns: [
                {
                    header: "Project Title",
                    field: "project.title",
                    body: (r: Collaborator) => {
                        const title = typeof r.project === "object" ? r.project?.title : "Unknown Project";
                        return (
                            <div
                                className="truncate text-sm font-medium"
                                title={title}
                                style={{ maxWidth: "350px" }}
                            >
                                {title}
                            </div>
                        );
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
                                {(lead as any)?.name ?? "N/A"}
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
                    const projectId = typeof collaborator?.project === 'object'
                        ? collaborator.project?._id
                        : collaborator?.project;

                    if (!projectId) return <div className="p-3 text-500">No project ID found.</div>;
                    return <ProjectDetail project={projectId} />;
                }
            }
        });
    }, []);

    if (loading) {
        return <div className="p-4 text-center">Loading memberships...</div>;
    }

    if (collaborators.length === 0) {
        return (
            <EmptyState
                icon="pi pi-users"
                title="No project memberships"
                description="You are not listed as a collaborator on any active projects."
            />
        );
    }

    return <Manager items={collaborators} />;
};

export default MyMembershipsManager;