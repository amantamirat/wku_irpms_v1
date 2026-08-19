'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { format } from "date-fns";
import { ProgressSpinner } from "primereact/progressspinner";
import { TabPanel, TabView } from "primereact/tabview";
import { Project } from "../models/project.model";
import { ProjectApi } from "../api/project.api";
import CollaboratorManager from "../../collaborators/project/Manager";
import ApplicationManager from "../../applications/project/Manager";
import PhaseManager from "../phases/project/Manager";
import { etbCurrencyFormatter } from "@/utils/currencyUtil";
import VerificationManager from "../../verifications/project/Manager";


interface ProjectDetailProps {
    project: string | Project;
    updateProject?: (project: Project) => void;
    enableEditing?: boolean;
}

export default function ProjectDetail({ project, updateProject, enableEditing }: ProjectDetailProps) {
    const { hasPermission } = useAuth();

    const [projectData, setProjectData] = useState<Project | null>(
        typeof project === 'object' ? project : null
    );
    const [loading, setLoading] = useState<boolean>(typeof project === 'string');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof project === 'string') {
            setLoading(true);
            setError(null);

            ProjectApi.getById!(project, true)
                .then((project: Project) => {
                    setProjectData(project);
                })
                .catch((err: any) => {
                    console.error("Failed to load project details:", err);
                    setError("Failed to load project details. Please try again.");
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setProjectData(project);
            setLoading(false);
        }
    }, [project]);

    // Internal wrapper to handle updating local state alongside parent callback
    const handleUpdateProject = (updated: Project) => {
        setProjectData(updated);
        if (updateProject) {
            updateProject(updated);
        }
    };

    if (loading) {
        return (
            <div className="surface-card border-round p-5 flex flex-column align-items-center justify-content-center shadow-1">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
                <span className="text-500 font-medium mt-3">Loading project details...</span>
            </div>
        );
    }

    if (error || !projectData) {
        return (
            <div className="surface-card border-round p-4 text-center text-red-600 shadow-1">
                <i className="pi pi-exclamation-circle text-3xl mb-2"></i>
                <p className="m-0 font-medium">{error || "Project data could not be found."}</p>
            </div>
        );
    }

    // 1. Format Budget
    /*
    const displayBudget = new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0
    }).format(projectData?.totalBudget || 0);
    */

    // 2. Format Total Duration
    let displayDuration = 'Not Specified';
    const totalDays = projectData?.totalDuration;
    if (totalDays) {
        const months = Math.floor(totalDays / 30);
        const days = totalDays % 30;
        let label = '';
        if (months > 0) label += `${months}m `;
        if (days > 0 || months === 0) label += `${days}d`;
        displayDuration = label.trim();
    }

    // 3. Fallback for Total Collaborators
    const totalCollabs = projectData?.totalCollabs ?? 0;

    // Helper for Names
    const getDisplayName = (field: any, labelKey: string = 'name') => {
        if (!field) return 'N/A';
        return typeof field === 'object' ? field[labelKey] || field.title : field;
    };

    // Helper for Themes (Handles objects or plain strings)
    const getThemeName = (theme: any) => {
        if (!theme) return '';
        if (typeof theme === 'object') {
            return theme.name || theme.title || 'Untitled Theme';
        }
        return theme;
    };

    // Tab Configuration
    const tabs = [
        {
            header: "Phases",
            icon: "pi pi-list",
            permission: "phase:read",
            content: <PhaseManager project={projectData} updateProject={updateProject} enableEditing={enableEditing} />
        },
        {
            header: "Collaborators",
            icon: "pi pi-users",
            permission: PERMISSIONS.COLLABORATOR.READ,
            content: <CollaboratorManager project={projectData} enableEditing={enableEditing} />
        }
    ];

    // 2. Conditionally add Application Manager tab if projectData.call exists
    if (projectData?.call) {
        tabs.push({
            header: "Applications",
            icon: "pi pi-folder-open",
            // Use PERMISSIONS.APPLICATION?.READ or PERMISSIONS.PROJECT?.READ based on your setup
            permission: (PERMISSIONS as any).APPLICATION?.READ || PERMISSIONS.PROJECT.READ,
            content: <ApplicationManager project={projectData} enableEditing={enableEditing} />
        });
    }


    // 2. Conditionally add Application Manager tab if projectData.call exists
    if (projectData?.currentVerification) {
        tabs.push({
            header: "Verifications",
            icon: 'pi pi-fw pi-check-square',
            // Use PERMISSIONS.APPLICATION?.READ or PERMISSIONS.PROJECT?.READ based on your setup
            //permission: "verification:read",
            permission: "project:read",
            content: <VerificationManager project={project} />
        });
    }

    const allowedTabs = tabs.filter(tab => hasPermission([tab.permission]));

    return (
        <div className="surface-card border-round p-3 shadow-1">

            {/* Header */}
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 pb-3 border-bottom-1 border-200">
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold m-0 mb-2 text-900">
                        {projectData?.title || 'Untitled Project'}
                    </h1>

                    <div className="flex flex-wrap gap-3 text-xs font-medium text-500 uppercase align-items-center">
                        <span className="flex align-items-center px-2 py-1 border-round surface-100">
                            <i className="pi pi-tag mr-2 text-primary"></i>
                            {getDisplayName((projectData?.grant), 'title')}
                        </span>

                        <span className="flex align-items-center px-2 py-1 border-round surface-100">
                            <i className="pi pi-user mr-2 text-primary"></i>
                            {getDisplayName(projectData?.leadPI, 'name')}
                        </span>
                    </div>

                    {/* Themes Tags/Badges */}
                    {projectData?.themes && projectData.themes.length > 0 && (
                        <div className="flex flex-wrap align-items-center gap-2 mt-3">
                            <span className="text-xs font-bold text-500 uppercase mr-1">
                                <i className="pi pi-bookmark mr-1"></i>
                                Themes:
                            </span>
                            {projectData.themes.map((theme, index) => {
                                const themeName = getThemeName(theme);
                                return (
                                    <span
                                        key={typeof theme === 'object' && theme._id ? theme._id : index}
                                        className="bg-blue-50 text-blue-700 border-1 border-blue-200 px-2 py-1 border-round text-xs font-semibold"
                                    >
                                        {themeName}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex align-items-center gap-3">
                    <MyBadge type="status" value={projectData?.status ?? "Draft"} />
                </div>
            </div>

            {/* Metrics */}
            <div className="grid mt-4 mb-4 gap-3 md:gap-0">
                <div className="col-12 sm:col-6 md:col-3 p-2">
                    <div className="p-3 surface-100 border-round border-left-3 border-green-500 h-full">
                        <span className="block text-500 text-xs font-bold mb-1 uppercase">Budget Allocation</span>
                        <div className="text-xl font-bold text-900">{etbCurrencyFormatter.format(projectData.totalBudget ?? 0)}</div>
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

                {projectData?.createdAt && (
                    <div className="col-12 sm:col-6 md:col-3 p-2">
                        <div className="p-3 surface-100 border-round h-full">
                            <span className="block text-500 text-xs font-bold mb-1 uppercase">Created On</span>
                            <div className="text-sm font-bold text-900 pt-1">
                                {format(new Date(projectData.createdAt), 'PPP')}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            {projectData?.summary && (
                <div className="mb-4 p-3 bg-bluegray-50 border-round border-1 border-100">
                    <h4 className="text-xs font-bold uppercase text-500 mt-0 mb-2 tracking-wider">Project Summary</h4>
                    <p className="text-sm text-700 m-0 line-height-3 italic">
                        {projectData.summary}
                    </p>
                </div>
            )}

            {/* Tabs */}
            <TabView key={projectData?._id} className="mt-2" renderActiveOnly={true}>
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