'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { useMemo } from "react";
import { Calendar } from "../../calendars/models/calendar.model";
import { getAllocationLabel } from "../../grants/allocations/components/AllocationTempletes";
import { GrantAllocation } from "../../grants/allocations/models/grant.allocation.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { User } from "../../users/models/user.model";
import { ProjectApi } from "../api/project.api";
import { GetProjectsOptions, Project, ProjectStatus } from "../models/project.model";
import { PROJECT_STATUS_ORDER, PROJECT_TRANSITIONS } from "../models/project.state-machine";
import ProjectDetail from "./ProjectDetail";
import SaveProject from "./SaveProject";

interface ProjectManagerProps {
    grantAllocation?: GrantAllocation;
    grant?: Grant;
    calendar?: Calendar;
    applicant?: User;
    workspace?: Organization;
    onItemsChange?: (items: Project[]) => void;
}

const ProjectManager = ({ grantAllocation, applicant, grant, calendar, workspace, onItemsChange }: ProjectManagerProps) => {
    const { getUser } = useAuth();
    const activeUser = getUser();

    const columns = useMemo(() => {
        const cols: any[] = [
            {
                header: "Allocation",
                field: "grantAllocation.grant.title",
                sortable: true,
                body: (r: Project) => (
                    <div
                        className="text-900 font-medium truncate"
                        style={{ maxWidth: '200px' }}
                        title={getAllocationLabel(r.grantAllocation)}
                    >
                        {getAllocationLabel(r.grantAllocation)}
                    </div>
                )
            },
            {
                header: "Title",
                field: "title",
                sortable: true,
                body: (row: Project) => (
                    <div
                        className="text-700 truncate text-sm"
                        style={{ maxWidth: '250px' }}
                        title={row.title}
                    >
                        {row.title}
                    </div>
                )
            }
        ];

        // ✅ Add Applicant column ONLY if not provided
        if (!applicant) {
            cols.push({
                header: "Applicant",
                field: "applicant.name",
                sortable: true,
                body: (p: Project) => (
                    <span className="text-600">
                        {typeof p.applicant === "object"
                            ? p.applicant?.name
                            : p.applicant}
                    </span>
                )
            });
        }

        // Always include status
        cols.push({
            field: "status",
            header: "Status",
            sortable: true,
            body: (p: Project) => (
                <MyBadge type="status" value={p.status ?? "Draft"} />
            )
        });

        return cols;
    }, [applicant]);

    const Manager = useMemo(() =>
        createEntityManager<Project, GetProjectsOptions | undefined>({
            title: "Manage Projects",
            itemName: "Project",
            api: ProjectApi,
            onItemsChange: onItemsChange,
            columns: columns,
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
            hideDefaultActions: !applicant,
            disableDeleteRow: (row) => row.status !== ProjectStatus.draft,
            expandable: {
                template: (project, actions) => <ProjectDetail project={project}
                    updateProject={(updated: Project) => {
                        actions.updateItem(updated);
                    }}
                />
            }
        }), [grantAllocation?._id, workspace?._id, applicant?._id, activeUser?._id]);


    return (
        <Manager />
    );
};

export default ProjectManager;