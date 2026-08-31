'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Grant } from "../../grants/models/grant.model";
import ProjectDetail from "../../projects/components/ProjectDetail";
import { ProjectApi } from "../api/project.api";
import { Project } from "../models/project.model";
import { CALL_PROJECT_TRANSITIONS, PROJECT_STATUS_ORDER, STANDALONE_PROJECT_TRANSITIONS } from "../models/project.state-machine";
import { etbCurrencyFormatter } from "@/utils/currencyUtil";
import ProjectWizard from "../components/wirzard/ProjectWizard";

interface ProjectManagerProps {
    grant: Grant;
}

const GrantProjectManager = ({ grant }: ProjectManagerProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!grant) return;
            setLoading(true);
            try {
                const data = await ProjectApi.getAll({ grant: grant });
                setProjects(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching grant projects", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [grant]);

    const handleUpdateProject = useCallback((updatedProject: Partial<Project>) => {
        setProjects((prevProjects) =>
            prevProjects.map((item) => {
                const itemId = item._id;
                const updatedId = updatedProject._id;
                if (itemId && updatedId && itemId === updatedId) {
                    return { ...item, ...updatedProject } as Project;
                }
                return item;
            })
        );
    }, []);

    // ✅ STABLE COMPONENT DEFINITION: 'projects' is NOT in dependency array
    const Manager = useMemo(() => {
        return createEntityManager<Project>({
            title: "Manage Projects",
            itemName: "Project",
            api: ProjectApi,
            columns: [
                { header: "Calendar", field: "calendar.year", sortable: true },
                {
                    header: "Title",
                    field: "title",
                    sortable: true,
                    body: (row: Project) => (
                        <div className="text-700 truncate text-sm" style={{ maxWidth: '250px' }} title={row.title}>
                            {row.title}
                        </div>
                    )
                },
                {
                    header: "Lead",
                    field: "leadPI.name",
                    sortable: true,
                    body: (p: Project) => (
                        <span className="text-600">
                            {typeof p.leadPI === "object" ? p.leadPI?.name : p.leadPI}
                        </span>
                    )
                },
                {
                    header: "Budget",
                    field: "totalBudget",
                    sortable: true,
                    body: (p: Project) => (
                        <span className="text-500">
                            {p.totalBudget ?
                                etbCurrencyFormatter.format(p.totalBudget) : 'N/A'}
                        </span>
                    )
                },
                {
                    header: "Status",
                    field: "status",
                    sortable: true,
                    body: (r: Project) => (
                        <MyBadge type="status" value={r.status ?? "Unknown"} />
                    )
                }
            ],
            createNew: () => ({
                //leadPI: user,
                title: "",
                summary: "",
                themes: [],
                grant
            }),
            SaveDialog: ProjectWizard,
            permissionPrefix: "project",
            workflow: {
                statusField: "status",
                transitions: (project: Project) =>
                    project.call
                        ? CALL_PROJECT_TRANSITIONS
                        : STANDALONE_PROJECT_TRANSITIONS,
                statusOrder: PROJECT_STATUS_ORDER
            },
            expandable: {
                template: (project) => (
                    <ProjectDetail project={project} updateProject={handleUpdateProject} />
                )
            },
            //hideDefaultActions: true,
        });
    }, [handleUpdateProject]); // 👈 Removed 'projects' from dependencies!

    if (loading) {
        return <div className="p-4 text-center">Loading projects...</div>;
    }

    // ✅ Pass items directly to the stable component
    return <Manager items={projects} />;
};

export default GrantProjectManager;