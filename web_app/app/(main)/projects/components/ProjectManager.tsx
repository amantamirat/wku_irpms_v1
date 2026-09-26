'use client';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { etbCurrencyFormatter } from "@/utils/utils";
import ProjectWizard from "../components/wirzard/ProjectWizard";
import { ProjectApi } from "../api/project.api";
import { Project } from "../models/project.model";
import { PROJECT_TRANSITIONS } from "../models/project.state-machine";
import ProjectDetail from "../../projects/components/ProjectDetail";

const ProjectManager = createEntityManager<Project>({
    title: "Manage Projects",
    itemName: "Project",
    api: ProjectApi,

    columns: [
        {
            header: "Grant",
            field: "grant.title",
            sortable: true,
            body: (row: Project) => {
                const grant = typeof row.grant === "object" && row.grant !== null ? row.grant : null;
                const title = grant?.title ?? (typeof row.grant === "string" ? row.grant : "N/A");
                return (
                    <div className="truncate text-sm font-medium text-700" title={title} style={{ maxWidth: "200px" }}>
                        {title}
                    </div>
                );
            }
        },
        {
            header: "Calendar",
            field: "calendar.year",
            sortable: true,
            body: (row: Project) => {
                const calendar = typeof row.calendar === "object" && row.calendar !== null ? row.calendar : null;
                const year = calendar?.year ?? (typeof row.calendar === "string" || typeof row.calendar === "number" ? String(row.calendar) : "N/A");
                return (
                    <span className="text-600 font-medium">
                        {year}
                    </span>
                );
            }
        },
        {
            header: "Organization",
            field: "organization.name",
            sortable: true,
            body: (row: Project) => {
                const org = typeof row.organization === "object" && row.organization !== null ? row.organization : null;
                const name = org?.name ?? (typeof row.organization === "string" ? row.organization : "N/A");
                return (
                    <span className="text-600">
                        {name}
                    </span>
                );
            }
        },
        {
            header: "Workspace",
            field: "workspace.name",
            sortable: true,
            body: (row: Project) => {
                const ws = typeof row.workspace === "object" && row.workspace !== null ? row.workspace : null;
                const name = ws?.name ?? (typeof row.workspace === "string" ? row.workspace : "N/A");
                return (
                    <span className="text-600">
                        {name}
                    </span>
                );
            }
        },
        {
            header: "Title",
            field: "title",
            sortable: true,
            body: (row: Project) => (
                <div
                    className="font-medium text-900 truncate text-sm"
                    style={{ maxWidth: "250px" }}
                    title={row.title}
                >
                    {row.title || "Untitled Project"}
                </div>
            )
        },
        {
            header: "Lead",
            field: "leadPI.name",
            sortable: true,
            body: (project: Project) => {
                const lead = typeof project.leadPI === "object" && project.leadPI !== null ? project.leadPI : null;
                const name = lead?.name ?? (typeof project.leadPI === "string" ? project.leadPI : "N/A");
                return (
                    <span className="text-700 font-medium">
                        {name}
                    </span>
                );
            }
        },
        {
            header: "Budget",
            field: "totalBudget",
            sortable: true,
            body: (project: Project) => (
                <span className="font-semibold text-900">
                    {typeof project.totalBudget === "number"
                        ? etbCurrencyFormatter.format(project.totalBudget)
                        : "N/A"}
                </span>
            )
        },
        {
            header: "Status",
            field: "status",
            sortable: true,
            body: (project: Project) => (
                <MyBadge
                    type="status"
                    value={project.status ?? "Unknown"}
                />
            )
        }
    ],

    defaultHiddenFields: ["grant.title", "calendar.year", "organization.name", "workspace.name"],
    enableColumnToggle: true,

    createNew: () => ({
        title: "",
        summary: "",
        themes: []
    }),

    SaveDialog: ProjectWizard,

    permissionPrefix: "project",

    workflow: {
        statusField: "status",
        transitions: PROJECT_TRANSITIONS
    },

    expandable: {
        template: (project) => (
            <ProjectDetail project={project} enableEditing={true} showReviewers={true} />
        )
    }
});

export default ProjectManager;