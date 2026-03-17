'use client';

import { Divider } from "primereact/divider";
import { TabView, TabPanel } from "primereact/tabview";
import { useMemo } from "react";

import { Project } from "../models/project.model";
import CollaboratorManager from "../collaborators/components/CollaboratorManager";
import ProjectThemeManager from "../themes/components/ThemeManager";
import PhaseManager from "../phases/components/PhaseManager";
import { PhaseType } from "../phases/models/phase.model";
import ProjectDocManager from "../documents/components/ProjectDocManager";
import { PERMISSIONS } from "@/types/permissions";
import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";

interface ProjectDetailProps {
    project: Project;
    updateProjectStatus?: (project: Project) => void;
}

export default function ProjectDetail({ project, updateProjectStatus }: ProjectDetailProps) {
    const { hasPermission } = useAuth();

    // Helper to extract display name from populated objects or IDs
    const getDisplayName = (field: any, labelKey: string = 'name') => {
        if (!field) return 'N/A';
        return typeof field === 'object' ? field[labelKey] || field.title : field;
    };

    const tabs = useMemo(() => [
        {
            header: "Collaborators",
            permission: PERMISSIONS.COLLABORATOR.READ,
            content: <CollaboratorManager project={project} />
        },
        {
            header: "Themes",
            permission: PERMISSIONS.PROJECT_THEME.READ,
            content: <ProjectThemeManager project={project} />
        },
        {
            header: "Phases",
            permission: PERMISSIONS.PHASE.READ,
            content: <PhaseManager project={project} phaseType={PhaseType.phase} />
        },
        {
            header: "Documents",
            permission: PERMISSIONS.DOCUMENT.READ,
            content: <ProjectDocManager project={project} updateProjectStatus={updateProjectStatus} />
        }
    ], [project, updateProjectStatus]);

    const allowedTabs = tabs.filter(tab => hasPermission([tab.permission]));

    return (
        <div className="project-detail p-3">
            <div className="grid">
                <div className="col-12 md:col-6">
                    <h2 className="m-0 mb-2">{project.title}</h2>
                    <div className="flex flex-column gap-2">
                        <span>
                            <strong>Grant:</strong> {getDisplayName(project.grant, 'title')}
                        </span>
                        {
                            /**
                             * <span>
                            <strong>Workspace:</strong> {getDisplayName(project.workspace, 'name')}
                        </span>
                             */
                        }

                    </div>
                </div>

                <div className="col-12 md:col-6 md:text-right">
                    <div className="flex flex-column gap-2">
                        <span>
                            <strong>Status:</strong> <MyBadge type="status" value={project.status ?? "Draft"} />
                        </span>
                        <span>
                            <strong>Created By:</strong> {getDisplayName(project.applicant, 'name')}
                        </span>
                        <span className="text-sm text-500">
                            <strong>Date:</strong> {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            <Divider />

            {project.summary && (
                <div className="summary mb-4">
                    <h4 className="mt-0">Summary</h4>
                    <p className="line-height-3 text-700">{project.summary}</p>
                </div>
            )}

            <TabView>
                {allowedTabs.map((tab, index) => (
                    <TabPanel key={index} header={tab.header}>
                        <div className="pt-3">
                            {tab.content}
                        </div>
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
}