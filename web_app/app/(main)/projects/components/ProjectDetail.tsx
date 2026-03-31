'use client';

import { Divider } from "primereact/divider";
import { TabView, TabPanel } from "primereact/tabview";
import { useMemo } from "react";
import { Project } from "../models/project.model";
import CollaboratorManager from "../collaborators/components/CollaboratorManager";
import PhaseManager from "../phases/components/PhaseManager";
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
        return value
            ? new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(value)
            : '0.00 ETB';
    };

    const tabs = useMemo(() => [
        {
            header: "Collaborators",
            permission: PERMISSIONS.COLLABORATOR.READ,
            content: <CollaboratorManager project={project} />
        },
        {
            header: "Phases",
            permission: PERMISSIONS.PHASE.READ,
            content: <PhaseManager project={project} />
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

            {/* 🔹 Compact Header */}
            <div className="grid align-items-center mb-3">
                <div className="col-12 lg:col-8">
                    <h3 className="text-2xl md:text-3xl font-semibold m-0 text-900">
                        {project.title}
                    </h3>

                    <div className="flex flex-wrap gap-3 text-sm text-600 mt-2">
                        <span className="flex align-items-center">
                            <i className="pi pi-ticket mr-1 text-primary text-sm"></i>
                            {getDisplayName(project.grant, 'title')}
                        </span>

                        <span className="flex align-items-center">
                            <i className="pi pi-user mr-1 text-primary text-sm"></i>
                            {getDisplayName(project.applicant, 'name')}
                        </span>
                    </div>
                </div>

                <div className="col-12 lg:col-4">
                    <div className="flex lg:justify-content-end align-items-center gap-3 mt-2 lg:mt-0">
                        <MyBadge type="status" value={project.status ?? "Draft"} />

                        <span className="text-xs text-500">
                            {project.createdAt
                                ? new Date(project.createdAt).toLocaleDateString()
                                : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            <Divider />

            {/* 🔹 Financials & Duration (more compact cards) */}
            <div className="grid mb-4">
                <div className="col-12 md:col-4">
                    <div className="p-2 border-round bg-gray-50 border-1 border-200">
                        <span className="block text-500 text-xs mb-1">Total Budget</span>
                        <div className="text-900 font-semibold">
                            {formatCurrency(project.totalBudget)}
                        </div>
                    </div>
                </div>

                <div className="col-12 md:col-4">
                    <div className="p-2 border-round bg-gray-50 border-1 border-200">
                        <span className="block text-500 text-xs mb-1">Duration</span>
                        <div className="text-900 font-semibold">
                            {project.totalDuration
                                ? `${project.totalDuration} Months`
                                : 'Not Specified'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔹 Summary */}
            {project.summary && (
                <div className="summary mb-4">
                    <h4 className="text-lg font-medium mt-0 mb-1">Project Summary</h4>
                    <p className="text-sm text-700 m-0 line-height-3" style={{ maxWidth: '700px' }}>
                        {project.summary}
                    </p>
                </div>
            )}

            {/* 🔹 Tabs */}
            <TabView className="mt-3">
                {allowedTabs.map((tab, index) => (
                    <TabPanel key={index} header={tab.header}>
                        <div className="pt-2">
                            {tab.content}
                        </div>
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
}