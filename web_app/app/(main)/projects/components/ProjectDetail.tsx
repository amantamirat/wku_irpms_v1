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


interface ProjectDetailProps {
    project: Project;
    updateProjectStatus?: (project: Project) => void;
}

export default function ProjectDetail({ project, updateProjectStatus }: ProjectDetailProps) {

    const { hasPermission } = useAuth();

    // Define tabs in a scalable way
    const tabs = useMemo(() => [
        {
            header: "Collaborators",
            permission: PERMISSIONS.COLLABORATOR.READ,
            content: <CollaboratorManager project={project} />
        },
        {
            header: "Themes",
            permission: PERMISSIONS.THEME.READ,
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

    // Filter tabs based on permissions
    const allowedTabs = tabs.filter(tab => hasPermission([tab.permission]));

    return (
        <div className="project-detail">
            <div className="header">
                <h2>{project.title}</h2>
                <p>Created At: {new Date(project.createdAt!).toLocaleDateString()}</p>
                <p>Created By: {(project.applicant as any).name}</p>
                <p>Status: <span className={`project-badge status-${project.status}`}>{project.status}</span></p>
            </div>

            <Divider />

            {project.summary && (
                <div className="summary">
                    <h4>Summary</h4>
                    <p>{project.summary}</p>
                </div>
            )}

            <TabView>
                {allowedTabs.map((tab, index) => (
                    <TabPanel key={index} header={tab.header}>
                        {tab.content}
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
}
