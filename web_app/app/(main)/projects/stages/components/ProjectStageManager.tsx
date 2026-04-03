'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { ProjectStage, ProjectStageStatus, GetProjectStageOptions, createEmptyProjectStage } from "../models/project.stage.model";
import { ProjectStageApi } from "../api/project.stage.api"; // Assuming your API implementation
import SaveProjectStage from "./SaveProjectStage";
import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { Project } from "../../models/project.model";
import { PROJECT_STAGE_STATUS_ORDER, PROJECT_STAGE_TRANSITIONS } from "../models/project.stage.state-machine";

interface ProjectStageManagerProps {
    project?: string | Project;
}

const ProjectStageManager = ({ project }: ProjectStageManagerProps) => {

    const Manager = createEntityManager<ProjectStage, GetProjectStageOptions | undefined>({
        title: "Project Submissions & Stages",
        itemName: "Project Stage",
        api: ProjectStageApi,

        columns: [
            {
                header: "Stage Name",
                field: "grantStage",
                body: (ps: ProjectStage) =>
                    typeof ps.grantStage === "object"
                        ? (ps.grantStage as GrantStage)?.name
                        : "Loading..."
            },
            {
                header: "Status",
                field: "status",
                sortable: true,
                body: (ps: ProjectStage) => (
                    <MyBadge type="status" value={ps.status ?? ProjectStageStatus.submitted} />
                )
            },
            {
                header: "Score",
                field: "totalScore",
                sortable: true,
                body: (ps: ProjectStage) => ps.totalScore !== null ? `${ps.totalScore}` : "-"
            },
            {
                header: "Document",
                body: (ps: ProjectStage) => ps.documentPath ? (
                    <a
                        href={ps.documentPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        <i className="pi pi-file-pdf mr-1"></i> View PDF
                    </a>
                ) : <span className="text-gray-400">No File</span>
            },
            {
                header: "Submitted At",
                field: "createdAt",
                body: (ps: ProjectStage) => ps.createdAt ? new Date(ps.createdAt).toLocaleDateString() : "-"
            }
        ],


        createNew: () => createEmptyProjectStage({
            project
        }),

        // Use the SaveProjectStage dialog we built previously
        SaveDialog: SaveProjectStage,

        permissionPrefix: "project.stage",

        // Restrict list to current project and ensure related objects are populated
        query: () => ({
            project: typeof project === "object" ? project._id : project,
            populate: true
        }),
        workflow: {
            statusField: "status",
            statusOrder: PROJECT_STAGE_STATUS_ORDER,
            transitions: PROJECT_STAGE_TRANSITIONS
        },

        // Safety: usually project stages are audit-critical, so we disable direct deletion
        disableDeleteRow: () => true
    });

    return <Manager />;
};

export default ProjectStageManager;