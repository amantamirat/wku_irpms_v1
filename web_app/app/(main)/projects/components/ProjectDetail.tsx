'use client';

import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { TabPanel, TabView } from "primereact/tabview";
import { useMemo, useCallback } from "react";
import CollaboratorManager from "../collaborators/components/CollaboratorManager";
import { Project } from "../models/project.model";
import PhaseManager from "../phases/components/PhaseManager";
import ProjectStageManager from "../stages/components/ProjectStageManager";

interface ProjectDetailProps {
    project: Project;
    updateProject?: (project: Project) => void;
}

export default function ProjectDetail({ project, updateProject }: ProjectDetailProps) {
    const { hasPermission } = useAuth();

    const getDisplayName = useCallback((field: any, labelKey: string = 'name') => {
        if (!field) return 'N/A';
        return typeof field === 'object' ? field[labelKey] || field.title : field;
    }, []);

    const formatCurrency = useCallback((value?: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 0
        }).format(value || 0);
    }, []);

    const tabs = useMemo(() => [
        {
            header: "Phases",
            icon: "pi pi-list",
            permission: PERMISSIONS.PHASE.READ,
            content: <PhaseManager project={project} updateProject={updateProject} />
        },
        {
            header: "Collaborators",
            icon: "pi pi-users",
            permission: PERMISSIONS.COLLABORATOR.READ,
            content: <CollaboratorManager project={project} />
        },
        {
            header: "Stages",
            icon: "pi pi-map",
            permission: "project.stage:read",
            content: <ProjectStageManager project={project} hideReviewer={true} />
        }
    ], [project, updateProject]);

    const allowedTabs = tabs.filter(tab => hasPermission([tab.permission]));

    const durationText = useMemo(() => {
        if (!project.totalDuration) return 'Not Specified';
        const months = Math.floor(project.totalDuration / 30);
        const days = project.totalDuration % 30;
        return `${months}m ${days}d`.replace(' 0d', '');
    }, [project.totalDuration]);

    return (
        <div className="surface-card border-round p-3 shadow-1">

            {/* Header Area */}
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 pb-3 border-bottom-1 border-200">
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold m-0 mb-2 text-900">
                        {project.title}
                    </h1>

                    <div className="flex flex-wrap gap-3 text-xs font-medium text-500 uppercase">
                        <span className="flex align-items-center bg-gray-100 px-2 py-1 border-round">
                            <i className="pi pi-tag mr-2 text-primary"></i>
                            {getDisplayName((project.grantAllocation as any)?.grant, 'title')}
                        </span>
                        <span className="flex align-items-center bg-gray-100 px-2 py-1 border-round">
                            <i className="pi pi-calendar mr-2 text-primary"></i>
                            {getDisplayName((project.grantAllocation as any)?.calendar, 'year')}
                        </span>
                        <span className="flex align-items-center bg-gray-100 px-2 py-1 border-round">
                            <i className="pi pi-user mr-2 text-primary"></i>
                            {getDisplayName(project.applicant, 'name')}
                        </span>
                    </div>
                </div>

                <div className="flex align-items-center gap-3">
                    <MyBadge type="status" value={project.status ?? "Draft"} />
                </div>
            </div>

            {/* Metrics Section */}
            <div className="flex flex-wrap gap-3 mt-4 mb-4">
                <div className="flex-1 min-w-max p-3 surface-100 border-round border-left-3 border-green-500">
                    <span className="block text-500 text-xs font-bold mb-1 uppercase">Budget Allocation</span>
                    <div className="text-xl font-bold text-900">
                        {formatCurrency(project.totalBudget)}
                    </div>
                </div>

                <div className="flex-1 min-w-max p-3 surface-100 border-round border-left-3 border-blue-500">
                    <span className="block text-500 text-xs font-bold mb-1 uppercase">Total Duration</span>
                    <div className="text-xl font-bold text-900">
                        {durationText}
                    </div>
                </div>

                {project.createdAt && (
                    <div className="flex-1 min-w-max p-3 surface-100 border-round">
                        <span className="block text-500 text-xs font-bold mb-2 uppercase">Created On</span>
                        <div className="text-xl font-bold text-900 text-sm">
                            {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                )}
            </div>

            {/* Restored Summary Block */}
            {project.summary && (
                <div className="mb-4 p-3 bg-bluegray-50 border-round border-1 border-100">
                    <h4 className="text-xs font-bold uppercase text-500 mt-0 mb-2 tracking-wider">Project Summary</h4>
                    <p className="text-sm text-700 m-0 line-height-3 italic">
                        {project.summary}
                    </p>
                </div>
            )}

            {/* Content Tabs */}
            <TabView renderActiveOnly={false}>
                {allowedTabs.map((tab, index) => (
                    <TabPanel
                        key={index}
                        header={tab.header}
                        leftIcon={tab.icon + " mr-2"}
                    >
                        <div className="pt-4">
                            {tab.content}
                        </div>
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
}