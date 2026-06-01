'use client';

import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { format } from "date-fns";
import { TabPanel, TabView } from "primereact/tabview";

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

    // ==========================================
    // DERIVED STATE (No useEffect or state bugs)
    // ==========================================

    // 1. Format Budget Allocation
    const displayBudget = new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0
    }).format(project?.totalBudget || 0);

    // 2. Format Total Duration
    let displayDuration = 'Not Specified';
    const totalDays = project?.totalDuration;
    if (totalDays) {
        const months = Math.floor(totalDays / 30);
        const days = totalDays % 30;
        let label = '';
        if (months > 0) label += `${months}m `;
        if (days > 0 || months === 0) label += `${days}d`;
        displayDuration = label.trim();
    }

    // 3. Fallback for Total Collaborators
    const totalCollabs = project?.totalCollabs ?? 0;

    // Helper for Names
    const getDisplayName = (field: any, labelKey: string = 'name') => {
        if (!field) return 'N/A';
        return typeof field === 'object' ? field[labelKey] || field.title : field;
    };

    // Tab Configuration
    const tabs = [
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
            content: <ProjectStageManager project={project} hideReviewer={true} updateProject={updateProject} />
        }
    ];

    const allowedTabs = tabs.filter(tab => hasPermission([tab.permission]));

    return (
        <div className="surface-card border-round p-3 shadow-1">

            {/* Header */}
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 pb-3 border-bottom-1 border-200">
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold m-0 mb-2 text-900">
                        {project?.title || 'Untitled Project'}
                    </h1>
                    <div className="flex flex-wrap gap-3 text-xs font-medium text-500 uppercase">
                        <span className="flex align-items-center px-2 py-1 border-round">
                            <i className="pi pi-tag mr-2 text-primary"></i>
                            {getDisplayName((project?.grant), 'title')}
                        </span>
                        {
                            /**
                             *  <span className="flex align-items-center bg-gray-100 px-2 py-1 border-round">
                            <i className="pi pi-calendar mr-2 text-primary"></i>
                            {getDisplayName((project?.grant as any)?.calendar, 'year')}
                        </span>
                             */
                        }
                       
                        <span className="flex align-items-center px-2 py-1 border-round">
                            <i className="pi pi-user mr-2 text-primary"></i>
                            {getDisplayName(project?.applicant, 'name')}
                        </span>
                    </div>
                </div>
                <div className="flex align-items-center gap-3">
                    <MyBadge type="status" value={project?.status ?? "Draft"} />
                </div>
            </div>

            {/* Metrics */}
            <div className="grid mt-4 mb-4 gap-3 md:gap-0">
                <div className="col-12 sm:col-6 md:col-3 p-2">
                    <div className="p-3 surface-100 border-round border-left-3 border-green-500 h-full">
                        <span className="block text-500 text-xs font-bold mb-1 uppercase">Budget Allocation</span>
                        <div className="text-xl font-bold text-900">{displayBudget}</div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 md:col-3 p-2">
                    <div className="p-3 surface-100 border-round border-left-3 border-blue-500 h-full">
                        <span className="block text-500 text-xs font-bold mb-1 uppercase">Total Duration</span>
                        <div className="text-xl font-bold text-900">{displayDuration}</div>
                    </div>
                </div>

                <div className="col-12 sm:col-6 md:col-3 p-2">
                    <div className="p-3 surface-100 border-round border-left-3 border-orange-500 h-full">
                        <span className="block text-500 text-xs font-bold mb-1 uppercase">Collaborators</span>
                        <div className="text-xl font-bold text-900">{totalCollabs} Members</div>
                    </div>
                </div>

                {project?.createdAt && (
                    <div className="col-12 sm:col-6 md:col-3 p-2">
                        <div className="p-3 surface-100 border-round h-full">
                            <span className="block text-500 text-xs font-bold mb-1 uppercase">Created On</span>
                            <div className="text-sm font-bold text-900 pt-1">
                                {format(new Date(project.createdAt), 'PPP')}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            {project?.summary && (
                <div className="mb-4 p-3 bg-bluegray-50 border-round border-1 border-100">
                    <h4 className="text-xs font-bold uppercase text-500 mt-0 mb-2 tracking-wider">Project Summary</h4>
                    <p className="text-sm text-700 m-0 line-height-3 italic">
                        {project.summary}
                    </p>
                </div>
            )}

            {/* Tabs */}
            <TabView key={project?._id} className="mt-2" renderActiveOnly={true}>
                {allowedTabs.map((tab) => (
                    <TabPanel key={tab.header} header={tab.header} leftIcon={tab.icon + " mr-2"}>
                        <div className="pt-4">
                            {tab.content}
                        </div>
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
}