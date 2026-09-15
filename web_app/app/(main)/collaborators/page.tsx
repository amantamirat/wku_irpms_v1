'use client';

import MyBadge from "@/templates/MyBadge";
import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";
import { ItemDataTable } from "@/components/data-table/ItemDataTable";
import { Collaborator } from "./models/collaborator.model";
import { CollaboratorApi } from "./api/collaborator.api";
import ProjectDetail from "../projects/components/ProjectDetail";
import { extractId } from "@/utils/utils";

const CollaboratorsManager = () => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCollaborators = async () => {
            setLoading(true);

            try {
                const data = await CollaboratorApi.getAll();
                setCollaborators(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching collaborators", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCollaborators();
    }, []);

    const columns = [
        {
            header: "Project Title",
            field: "project.title",
            body: (collaborator: Collaborator) => {
                const project =
                    typeof collaborator.project === "object"
                        ? collaborator.project
                        : null;

                const title = project?.title ?? "Unknown Project";

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
            header: "Member",
            field: "user.name",
            sortable: true,
            body: (collaborator: Collaborator) => {
                const user =
                    typeof collaborator.member === "object"
                        ? collaborator.member
                        : null;

                return (
                    <div>
                        {(user as any)?.name ?? "N/A"}
                    </div>
                );
            }
        },
        {
            field: "role",
            header: "Role",
            sortable: true,
            body: (collaborator: Collaborator) => (
                <span>
                    {collaborator.role || "No Role Assigned"}
                </span>
            )
        },
        {
            header: "Lead",
            field: "project.leadPI.name",
            sortable: true,
            body: (collaborator: Collaborator) => {
                const project =
                    typeof collaborator.project === "object"
                        ? collaborator.project
                        : null;

                return (
                    <div>
                        {(project?.leadPI as any)?.name ?? "N/A"}
                    </div>
                );
            }
        },
        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (collaborator: Collaborator) => (
                <MyBadge
                    type="status"
                    value={collaborator.status ?? "Unknown"}
                />
            )
        }
    ];

    if (loading) {
        return (
            <div className="p-4 text-center">
                Loading collaborators...
            </div>
        );
    }

    if (collaborators.length === 0) {
        return (
            <EmptyState
                icon="pi pi-users"
                title="No collaborators found"
                description="There are no collaborators currently listed."
            />
        );
    }

    return (
        <div className="card border-none shadow-1 p-4 mb-4">
            <div className="mb-4">
                <h5 className="m-0 text-xl font-bold">
                    Collaborators Management
                </h5>

                <p className="text-500 text-sm m-0">
                    View and manage all project teams and roles
                </p>
            </div>

            <ItemDataTable
                items={collaborators}
                columns={columns}
                enableSearch={true}
                expandable={{
                    template: (collaborator) => {
                        const projectId =
                            extractId(collaborator.project);

                        if (!projectId) {
                            return (
                                <div className="p-3 text-500">
                                    No project ID found.
                                </div>
                            );
                        }

                        return (
                            <ProjectDetail project={projectId} />
                        );
                    }
                }}
            />
        </div>
    );
};

export default CollaboratorsManager;