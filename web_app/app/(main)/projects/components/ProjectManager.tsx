'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Project, GetProjectsOptions } from "../models/project.model";
import { ProjectApi } from "../api/project.api";
import SaveProject from "./SaveProject";
import ProjectDetail from "./ProjectDetail";
import { Grant } from "../../grants/models/grant.model";
import { Applicant } from "../../applicants/models/applicant.model";
import { Organization } from "../../organizations/models/organization.model";
import MyBadge from "@/templates/MyBadge";
import { PROJECT_STATUS_ORDER, PROJECT_TRANSITIONS } from "../models/project.state-machine";

interface ProjectManagerProps {
    grant?: Grant;
    applicant?: Applicant;
    workspace?: Organization;
}

const ProjectManager = ({ grant, applicant, workspace }: ProjectManagerProps) => {
    const Manager = createEntityManager<Project, GetProjectsOptions | undefined>({
        title: "Manage Projects",
        itemName: "Project",
        api: ProjectApi,

        columns: [
            {
                header: "Grant",
                field: "grant",
                sortable: true,
                style: { width: '150px', maxWidth: '150px' },
                body: (r: Project) => (
                    <div
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                        title={r.summary}
                    >
                        {typeof r.grant === "object" ? r.grant?.title : r.grant}
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
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (p: Project) =>
                    <MyBadge type="status" value={p.status ?? "Draft"} />
            }
        ],

        createNew: () => ({
            grant: grant ?? undefined,
            applicant: applicant ?? undefined,
            workspace: workspace ?? undefined,
            title: "",
            summary: ""
        }),

        SaveDialog: SaveProject,
        permissionPrefix: "project",
        query: () => ({
            populate: true,
            grant: grant?._id,
            workspace: workspace?._id
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