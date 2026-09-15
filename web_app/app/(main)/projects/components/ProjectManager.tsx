'use client';
import MyBadge from "@/templates/MyBadge";
import ProjectDetail from "../../projects/components/ProjectDetail";
import { ProjectApi } from "../api/project.api";
import { Project } from "../models/project.model";
import { PROJECT_TRANSITIONS } from "../models/project.state-machine";
import { etbCurrencyFormatter } from "@/utils/utils";
import ProjectWizard from "../components/wirzard/ProjectWizard";
import { createEntityManager } from "@/components/data-table/createEntityManager";

const ProjectManager = createEntityManager<Project>({
    title: "Manage Projects",
    itemName: "Project",
    api: ProjectApi,

    columns: [
        {
            header: "Calendar",
            field: "calendar.year",
            sortable: true
        },
        {
            header: "Title",
            field: "title",
            sortable: true,
            body: (row: Project) => (
                <div
                    className="text-700 truncate text-sm"
                    style={{ maxWidth: "250px" }}
                    title={row.title}
                >
                    {row.title}
                </div>
            )
        },
        {
            header: "Lead",
            field: "leadPI.name",
            sortable: true,
            body: (project: Project) => (
                <span className="text-600">
                    {typeof project.leadPI === "object"
                        ? project.leadPI?.name
                        : project.leadPI}
                </span>
            )
        },
        {
            header: "Budget",
            field: "totalBudget",
            sortable: true,
            body: (project: Project) => (
                <span className="text-500">
                    {project.totalBudget
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
    defaultHiddenFields: ["calendar.year"],
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
            <ProjectDetail project={project} />
        )
    }
});

export default ProjectManager;