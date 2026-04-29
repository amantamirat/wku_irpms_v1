'use client';
import { useMemo, useState } from "react";
import { createEntityManager } from "@/components/createEntityManager";
import { Project, GetProjectsOptions } from "../models/project.model";
import { ProjectApi } from "../api/project.api";
import SaveProject from "./SaveProject";
import ProjectDetail from "./ProjectDetail";
import { GrantAllocation } from "../../grants/allocations/models/grant.allocation.model";
import { User } from "../../users/models/user.model";
import { Organization } from "../../organizations/models/organization.model";
import MyBadge from "@/templates/MyBadge";
import { PROJECT_STATUS_ORDER, PROJECT_TRANSITIONS } from "../models/project.state-machine";
import { getAllocationLabel } from "../../grants/allocations/components/AllocationTempletes";
import { Calendar } from "../../calendars/models/calendar.model";
import { Grant } from "../../grants/models/grant.model";
import { useAuth } from "@/contexts/auth-context";
import { STATUS_BUTTON_CONFIG } from "@/components/status-button.config";

interface ProjectManagerProps {
    grantAllocation?: GrantAllocation;
    grant?: Grant;
    calendar?: Calendar;
    applicant?: User;
    workspace?: Organization;
}

const ProjectManager = ({ grantAllocation, applicant, grant, calendar, workspace }: ProjectManagerProps) => {
    const { getUser: getApplicant } = useAuth();
    const activeUser = getApplicant();
    const [projects, setProjects] = useState<Project[]>([]);

    // Aggregate counts for the top cards
    const statusCounts = useMemo(() => {
        return projects.reduce((acc, project) => {
            const status = project.status || "Draft";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [projects]);

    const Manager = useMemo(() =>
        createEntityManager<Project, GetProjectsOptions | undefined>({
            title: "Manage Projects",
            itemName: "Project",
            api: ProjectApi,
            onItemsChange: setProjects,
            columns: [
                {
                    header: "Allocation",
                    field: "grantAllocation",
                    sortable: true,
                    body: (r: Project) => (
                        <div className="text-900 font-medium truncate" style={{ maxWidth: '200px' }} title={getAllocationLabel(r.grantAllocation)}>
                            {getAllocationLabel(r.grantAllocation)}
                        </div>
                    )
                },
                {
                    header: "Title",
                    field: "title",
                    sortable: true,
                    body: (row: Project) => (
                        <div className="text-700 truncate" style={{ maxWidth: '250px' }} title={row.title}>
                            {row.title}
                        </div>
                    )
                },
                {
                    header: "Applicant",
                    field: "applicant.name",
                    sortable: true,
                    body: (p: Project) => (
                        <span className="text-600">
                            {typeof p.applicant === "object" ? p.applicant?.name : p.applicant}
                        </span>
                    )
                },
                {
                    field: "status",
                    header: "Status",
                    sortable: true,
                    body: (p: Project) => <MyBadge type="status" value={p.status ?? "Draft"} />
                }
            ],
            createNew: () => ({
                grantAllocation: grantAllocation ?? undefined,
                applicant: activeUser ?? undefined,
                workspace: workspace ?? undefined,
                title: "",
                summary: "",
                themes: []
            }),
            SaveDialog: SaveProject,
            permissionPrefix: "project",
            query: () => ({
                populate: true,
                grantAllocation: grantAllocation?._id,
                workspace: workspace?._id,
                applicant: applicant?._id,
                calendar: typeof calendar === 'object' ? (calendar as any)?._id : calendar,
                grant: typeof grant === 'object' ? (grant as any)?._id : grant,
            }),
            workflow: {
                statusField: "status",
                transitions: PROJECT_TRANSITIONS,
                statusOrder: PROJECT_STATUS_ORDER
            },
            expandable: {
                template: (project) => <ProjectDetail project={project} />
            }
        }), [grantAllocation?._id, workspace?._id, applicant?._id, activeUser?._id]);


    return (
        <div className="card">
            <div className="grid">
                {/* 1. Summary Cards Section */}
                {projects.length > 0 && (
                    <div className="col-12 grid mb-3">
                        {PROJECT_STATUS_ORDER.map((status) => {
                            const count = statusCounts[status] || 0;
                            // Match the case of your config keys
                            const config = STATUS_BUTTON_CONFIG[status.toLowerCase()] || STATUS_BUTTON_CONFIG.draft;

                            if (count === 0 && status.toLowerCase() !== 'draft') return null;

                            return (
                                <div key={status} className="col-12 md:col-6 lg:col-3">
                                    <div
                                        className="p-3 shadow-1 border-round surface-card h-full border-left-3 transition-all transition-duration-200 hover:shadow-3"
                                        style={{ borderLeftColor: `var(--${config.severity === 'secondary' ? 'gray' : config.severity}-500)` }}
                                    >
                                        <div className="flex align-items-center">
                                            {/* Icon Box with Dynamic Color */}
                                            <div className={`w-3rem h-3rem flex align-items-center justify-content-center border-round ${config.color || 'bg-gray-100 text-gray-700'}`}>
                                                <i className={`${config.icon} text-2xl`}></i>
                                            </div>

                                            <div className="ml-3 flex-grow-1">
                                                <div className="flex align-items-center justify-content-between mb-1">
                                                    <span className="text-600 font-medium text-sm uppercase tracking-wider">
                                                        {status}
                                                    </span>
                                                    {/* Optional Mini Badge */}
                                                </div>
                                                <div className="text-900 font-bold text-2xl">
                                                    {count}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 2. Main DataTable Manager */}
                <div className="col-12">
                    <div className="surface-card shadow-1 border-round">
                        <Manager />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectManager;