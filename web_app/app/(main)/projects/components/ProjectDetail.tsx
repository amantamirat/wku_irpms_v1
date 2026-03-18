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

    // Helper to extract display name
    const getDisplayName = (field: any, labelKey: string = 'name') => {
        if (!field) return 'N/A';
        return typeof field === 'object' ? field[labelKey] || field.title : field;
    };

    // Currency Formatter
    const formatCurrency = (value?: number) => {
        return value ? new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(value) : '0.00 ETB';
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
        <div className="project-detail p-4">
            <div className="grid align-items-start">
                {/* Large Title Section */}
                <div className="col-12 lg:col-8">
                    <h3 className="text-4xl font-bold m-0 mb-3 text-900 line-height-2">
                        {project.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-700">
                        <span className="flex align-items-center">
                            <i className="pi pi-ticket mr-2 text-primary"></i>
                            <strong>Grant:</strong>&nbsp;{getDisplayName(project.grant, 'title')}
                        </span>
                        <span className="flex align-items-center">
                            <i className="pi pi-user mr-2 text-primary"></i>
                            <strong>Applicant:</strong>&nbsp;{getDisplayName(project.applicant, 'name')}
                        </span>
                    </div>
                </div>

                {/* Status & Quick Stats */}
                <div className="col-12 lg:col-4 lg:text-right">
                    <div className="flex flex-column gap-3">
                        <div>
                            <MyBadge type="status" value={project.status ?? "Draft"} />
                        </div>
                        <div className="text-sm text-500">
                            <strong>Created:</strong> {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            <Divider />

            {/* Financials & Duration Row */}
            <div className="grid mb-4">
                <div className="col-12 md:col-4">
                    <div className="p-3 border-round bg-gray-50 border-1 border-200">
                        <span className="block text-500 font-medium mb-2">Total Budget</span>
                        <div className="text-900 font-bold text-xl">{formatCurrency(project.totalBudget)}</div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="p-3 border-round bg-gray-50 border-1 border-200">
                        <span className="block text-500 font-medium mb-2">Duration</span>
                        <div className="text-900 font-bold text-xl">
                            {project.totalDuration ? `${project.totalDuration} Months` : 'Not Specified'}
                        </div>
                    </div>
                </div>
            </div>

            {project.summary && (
                <div className="summary mb-5">
                    <h4 className="text-xl mt-0 mb-2">Project Summary</h4>
                    <p className="line-height-3 text-700 m-0" style={{ maxWidth: '800px' }}>
                        {project.summary}
                    </p>
                </div>
            )}

            <TabView className="mt-4">
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