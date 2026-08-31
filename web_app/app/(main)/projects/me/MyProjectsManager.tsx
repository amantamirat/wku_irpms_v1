'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import ProjectDetail from "../../projects/components/ProjectDetail";
import { ProjectApi } from "../api/project.api";
import { Project } from "../models/project.model";
import EmptyState from "@/components/EmptyState";

interface MyProjectsManagerProps {
    enableEditing?: boolean;
}

const MyProjectsManager = ({ enableEditing = true }: MyProjectsManagerProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ProjectApi.me();
            setProjects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching my projects", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // 1. ALL HOOKS MUST RUN FIRST
    const Manager = useMemo(() => {
        return createEntityManager<Project>({
            itemName: "Project",
            api: {
                ...ProjectApi,
                getAll: (filter) => ProjectApi.me(filter),
            },
            columns: [
                {
                    header: "Project Title",
                    field: "title",
                    sortable: true,
                    body: (p: Project) => (
                        <div
                            className="truncate text-sm font-medium"
                            title={p.title}
                            style={{ maxWidth: "350px" }}
                        >
                            {p.title}
                        </div>
                    )
                },
                {
                    header: "Status",
                    field: "status",
                    sortable: true,
                    body: (p: Project) => (
                        <MyBadge type="status" value={p.status ?? "Unknown"} />
                    )
                }
            ],
            permissionPrefix: "project",
            hideSearch: true,
            hideDefaultActions: true,
            expandable: {
                template: (project) => (
                    <ProjectDetail project={project} enableEditing={enableEditing} />
                )
            }
        });
    }, [enableEditing]);

    // 2. CONDITIONAL RETURNS GO AFTER ALL HOOKS
    if (loading) {
        return <div className="p-4 text-center text-500">Loading projects...</div>;
    }

    if (projects.length === 0) {
        return (
            <EmptyState
                icon="pi pi-folder-open"
                title="No projects found"
                description="You don't have any projects assigned to your account."
            />
        );
    }

    return <Manager items={projects} />;
};

export default MyProjectsManager;