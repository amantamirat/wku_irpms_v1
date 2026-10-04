'use client';

import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { etbCurrencyFormatter } from "@/utils/utils";
import { format } from "date-fns";
import { ProgressSpinner } from "primereact/progressspinner";
import { TabPanel, TabView } from "primereact/tabview";
import { useEffect, useState } from "react";
import ApplicationManager from "../../applications/project/Manager";
import CollaboratorManager from "../../collaborators/project/Manager";
import VerificationManager from "../../verifications/project/Manager";
import { ProjectApi } from "../api/project.api";
import { Project } from "../models/project.model";
import PhaseManager from "../phases/project/Manager";
import ReviewersManager from "../../reviewers/project/ReviewersManager";
import { StatusHistoryWidget } from "@/components/StatusHistoryWidget";
import ProjectProgress from "./ProjectProgress"; // Import the component

interface ProjectDetailProps {
    project: string | Project;
    updateProject?: (project: Project) => void;
    enableEditing?: boolean;
    showReviewers?: boolean;
}

export default function ProjectDetail({ project, updateProject, enableEditing, showReviewers = false }: ProjectDetailProps) {
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

            ProjectApi.getById!(project)
                .then((p: Project) => {
                    setProjectData(p);
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

    const totalCollabs = projectData?.totalCollabs ?? 0;

    const getDisplayName = (field: any, labelKey: string = 'name') => {
        if (!field) return 'N/A';
        return typeof field === 'object' ? field[labelKey] || field.title : field;
    };

    // Tab Configuration
    const tabs = [
        {
            header: "Phases",
            icon: "pi pi-list",
            permission: "phase:lookup",
            content: <PhaseManager project={projectData} updateProject={handleUpdateProject} enableEditing={enableEditing} />
        },
        {
            header: "Collaborators",
            icon: "pi pi-users",
            permission: "collaborator:lookup",
            content: <CollaboratorManager project={projectData} enableEditing={enableEditing} />
        }
    ];

    if (projectData?.currentApplication) {
        tabs.push({
            header: "Applications",
            icon: "pi pi-folder-open",
            permission: "application:lookup",
            content: <ApplicationManager project={projectData} enableEditing={enableEditing} />
        });
    }

    if (projectData?.currentVerification) {
        tabs.push({
            header: "Verifications",
            icon: 'pi pi-fw pi-check-square',
            permission: "verification:lookup",
            content: <VerificationManager project={project} enableEditing={enableEditing} />
        });
    }

    if (showReviewers) {
        tabs.push({
            header: "Reviewers",
            icon: 'pi pi-fw pi-star',
            permission: "reviewer:lookup",
            content: <ReviewersManager project={projectData._id!} />
        });
    }

    tabs.push({
        header: "Status History",
        icon: "pi pi-history",
        permission: "project:read",
        content: <StatusHistoryWidget history={projectData.statusHistory} />
    });

    const allowedTabs = tabs.filter(tab => hasPermission([tab.permission]));

    return (
        <div className="surface-card border-round p-3 shadow-1">
            {/* Header section */}
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
                            <i className="pi pi-calendar mr-2 text-green-500"></i>
                            {getDisplayName(projectData?.calendar, 'year')}
                        </span>
                        <span className="flex align-items-center px-2 py-1 border-round surface-100">
                            <i className="pi pi-user mr-2 text-primary"></i>
                            {getDisplayName(projectData?.leadPI, 'name')}
                        </span>
                    </div>
                </div>
                <div className="flex align-items-center gap-3">
                    <MyBadge type="status" value={projectData?.status ?? "Draft"} />
                </div>
            </div>

            {/* Metrics */}
            <div className="grid mt-4 mb-2 gap-3 md:gap-0">
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

            {/* Modular Project Progress Component */}
            {projectData?._id && <ProjectProgress projectId={projectData._id} />}

            {/* Tabs */}
            <TabView className="mt-2" renderActiveOnly={true}>
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