'use client';

import { useEffect, useState } from "react";
import MyBadge from "@/templates/MyBadge";
import ProjectDetail from "../../projects/components/ProjectDetail";
import { ProjectApi } from "../api/project.api";
import { Project } from "../models/project.model";
import EmptyState from "@/components/EmptyState";
import ProjectWizard from "../components/wirzard/ProjectWizard";
import { createEntityManager } from "@/components/data-table/createEntityManager";

interface MyProjectsManagerProps {
    enableEditing?: boolean;
}

const MyProjectsManager = ({
    enableEditing = true
}: MyProjectsManagerProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const data = await ProjectApi.me();
                setProjects(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching my projects", error);
            } finally {
                setLoading(false);
            }
        };

        loadProjects();
    }, []);

    if (loading) {
        return (
            <div className="p-4 text-center text-500">
                Loading projects...
            </div>
        );
    }

    const Manager = createEntityManager<Project>({
        itemName: "Project",
        api: ProjectApi,
        permissionPrefix: "project",
        initialItems: projects,
        hideSearch: true,

        columns: [
            {
                header: "Project Title",
                field: "title",
                sortable: true,
                body: (project: Project) => (
                    <div
                        className="truncate text-sm font-medium"
                        title={project.title}
                        style={{ maxWidth: "350px" }}
                    >
                        {project.title}
                    </div>
                )
            },
            {
                header: "Status",
                field: "status",
                sortable: true,
                body: (project: Project) => (
                    <MyBadge
                        type="status"
                        value={project.status ?? "Unknown"}
                    />
                )
            }
        ],

        createNew: () => ({
            title: "",
            summary: "",
            themes: [],
            lockLead: true
        }),

        SaveDialog: ProjectWizard,

        expandable: {
            template: (project) => (
                <ProjectDetail
                    project={project._id ?? ""}
                    enableEditing={enableEditing}
                />
            )
        }
    });

    return <Manager />;
};

export default MyProjectsManager;