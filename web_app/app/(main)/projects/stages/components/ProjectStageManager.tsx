'use client';

import { useMemo } from "react";
import { BASE_URL } from "@/api/ApiClient";
import { CallStage } from "@/app/(main)/calls/stages/models/call.stage.model";
import { GrantAllocation } from "@/app/(main)/grants/allocations/models/grant.allocation.model";
import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Project } from "../../models/project.model";
import { ProjectStageApi } from "../api/project.stage.api";
import { GetProjectStageOptions, ProjectStage, ProjectStageStatus, createEmptyProjectStage } from "../models/project.stage.model";
import { PROJECT_STAGE_STATUS_ORDER, PROJECT_STAGE_TRANSITIONS } from "../models/project.stage.state-machine";
import ProjectStageDetail from "./ProjectStageDetail";
import SaveProjectStage from "./SaveProjectStage";

interface ProjectStageManagerProps {
    project?: string | Project;
    grantStage?: string | GrantStage;
    grantAllocation?: string | GrantAllocation;
    callStage?: string | CallStage;
}

const ProjectStageManager = ({ project, grantStage, grantAllocation, callStage }: ProjectStageManagerProps) => {

    // ✅ Columns memoized
    const columns = useMemo(() => {
        const cols: any[] = [];

        // 1. Project Title + Stage Name combined (One line approach)
        if (!project) {
            cols.push({
                header: "Project",
                field: "project.title",
                sortable: true,
                body: (ps: ProjectStage) => {
                    const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                    return (
                        <div className="truncate text-sm" style={{ maxWidth: '300px' }} title={title}>
                            <span className="mr-1">{title}</span>
                        </div>
                    );
                }
            });

            cols.push({
                header: "Applicant",
                field: "project.applicant.name",
                sortable: true,
                body: (ps: ProjectStage) => {
                    const name = (ps.project as any).applicant.name ?? "Loading ...";
                    return (
                        <>{ name }</>
                    );
                }
            });
        }

        // 2. Fallback Stage Column (Only if not already shown in the title logic or if project context exists)
        if (project && !grantStage && !callStage) {
            cols.push({
                header: "Stage",
                field: "grantStage.name",
                body: (ps: ProjectStage) =>
                    typeof ps.grantStage === "object"
                        ? (ps.grantStage as GrantStage)?.name
                        : "N/A"
            });
        }

        // 3. Standard Columns
        cols.push(
            {
                header: "Document",
                body: (ps: ProjectStage) => ps.documentPath ? (
                    <a
                        href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex align-items-center"
                    >
                        <i className="pi pi-file-pdf mr-1"></i> View
                    </a>
                ) : <span className="text-gray-400">No File</span>
            },
            {
                header: "Score",
                field: "totalScore",
                sortable: true,
                body: (ps: ProjectStage) => typeof ps?.totalScore === "number" ? ps.totalScore : "N/A"
            },
            {
                header: "Status",
                field: "status",
                sortable: true,
                body: (ps: ProjectStage) => <MyBadge type="status" value={ps.status ?? ProjectStageStatus.submitted} />
            }
        );

        return cols;
    }, [project, grantStage, callStage]);

    // ✅ Manager memoized
    const Manager = useMemo(() =>
        createEntityManager<ProjectStage, GetProjectStageOptions | undefined>({
            title: "Project Submissions",
            itemName: "Project Stage",
            api: ProjectStageApi,
            columns: columns,
            createNew: project ? () => createEmptyProjectStage({ project }) : undefined,
            SaveDialog: project ? SaveProjectStage : undefined,
            permissionPrefix: "project.stage",
            query: () => ({
                project: typeof project === "object" ? project._id : project,
                grantStage: typeof grantStage === "object" ? grantStage._id : grantStage,
                grantAllocation: typeof grantAllocation === "object" ? grantAllocation._id : grantAllocation,
                populate: true
            }),
            workflow: {
                statusField: "status",
                statusOrder: PROJECT_STAGE_STATUS_ORDER,
                transitions: PROJECT_STAGE_TRANSITIONS
            },
            expandable: grantStage ? {
                template: (ps) => <ProjectStageDetail projectStage={ps} />
            } : undefined,
            hideEditAction: true,
            disableDeleteRow: (ps: ProjectStage) => ps.status !== ProjectStageStatus.submitted
        }),
        [columns, project, grantStage, grantAllocation]
    );

    return <Manager />;
};

export default ProjectStageManager;