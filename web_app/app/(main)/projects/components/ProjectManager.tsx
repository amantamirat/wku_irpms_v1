'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { Project, GetProjectsOptions } from "../models/project.model";
import { ProjectApi } from "../api/project.api";
import SaveProject from "./SaveProject";
import ProjectDetail from "./ProjectDetail";
import { GrantAllocation } from "../../grants/allocations/models/grant.allocation.model";
import { Applicant } from "../../applicants/models/applicant.model";
import { Organization } from "../../organizations/models/organization.model";
import MyBadge from "@/templates/MyBadge";
import { PROJECT_STATUS_ORDER, PROJECT_TRANSITIONS } from "../models/project.state-machine";
import { getAllocationLabel } from "../../grants/allocations/components/AllocationTempletes";

interface ProjectManagerProps {
    grantAllocation?: GrantAllocation;
    applicant?: Applicant;
    workspace?: Organization;
}

const ProjectManager = ({ grantAllocation, applicant, workspace }: ProjectManagerProps) => {
    const Manager = createEntityManager<Project, GetProjectsOptions | undefined>({
        title: "Manage Projects",
        itemName: "Project",
        api: ProjectApi,

        columns: [
            {
                header: "Allocation",
                field: "grantAllocation",
                sortable: true,
                style: { width: '200px', maxWidth: '200px' },
                body: (r: Project) => (
                    <div
                        className="truncate"
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                        title={getAllocationLabel(r.grantAllocation)}
                    >
                        {/* Uses the shared helper to show Year + Grant Title */}
                        {getAllocationLabel(r.grantAllocation)}
                    </div>
                )
            },
            {
                header: "Title",
                field: "title",
                sortable: true,
                style: { width: '250px', maxWidth: '250px' },
                body: (row: Project) => (
                    <div
                        className="truncate"
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                        title={row.title}
                    >
                        {row.title}
                    </div>
                )
            },
            /*
            {
                header: "Summary",
                field: "summary",
                body: (r: Project) => (
                    <div
                        className="text-overflow-ellipsis"
                        style={{
                            maxHeight: '3em',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}
                        title={r.summary}
                    >
                        {r.summary}
                    </div>
                )
            },
            */
            {
                header: "Applicant",
                field: "applicant.name",
                sortable: true,
                body: (p: Project) => (
                    <>
                        {typeof p.applicant === "object" ? p.applicant?.name : p.applicant}
                    </>
                )
            },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (p: Project) =>
                    <MyBadge type="status" value={p.status ?? "Draft"} />
            }
        ],

        createNew: () => ({
            grantAllocation: grantAllocation ?? undefined,
            applicant: applicant ?? undefined,
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
            applicant: applicant?._id
        }),
        workflow: {
            statusField: "status",
            transitions: PROJECT_TRANSITIONS,
            statusOrder: PROJECT_STATUS_ORDER
        },
        expandable: {
            template: (project) => (
                <ProjectDetail project={project} />
            )
        }
    });

    return <Manager />;
};

export default ProjectManager;