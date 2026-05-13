'use client';

import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "@/api/ApiClient";
import { CallStage } from "@/app/(main)/calls/stages/models/call.stage.model";
import { GrantAllocation } from "@/app/(main)/grants/allocations/models/grant.allocation.model";
import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Project, ProjectStatus } from "../../models/project.model"; // Added ProjectStatus
import { ProjectStageApi } from "../api/project.stage.api";
import { GetProjectStageOptions, ProjectStage, ProjectStageStatus, createEmptyProjectStage } from "../models/project.stage.model";
import { PROJECT_STAGE_STATUS_ORDER, PROJECT_STAGE_TRANSITIONS } from "../models/project.stage.state-machine";
import ProjectStageDetail from "./ProjectStageDetail";
import SaveProjectStage from "./SaveProjectStage";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { GrantStageApi } from "@/app/(main)/grants/stages/api/grant.stage.api";

interface ProjectStageManagerProps {
    project?: Project;
    grantStage?: string | GrantStage;
    grantAllocation?: string | GrantAllocation;
    callStage?: string | CallStage;
    hideReviewer?: boolean;

}

const ProjectStageManager = ({ project, grantStage, grantAllocation, callStage, hideReviewer }: ProjectStageManagerProps) => {


    const confirm = useConfirmDialog();

    /*
        const [stages, setStages] = useState<ProjectStage[] | null>(null);
        const [nextStage, setNextStage] = useState<GrantStage>();
    
        useEffect(() => {
            const stageCount = stages?.length || 0;
            const nextOrder = stageCount + 1;
            const fetctNextStage = async () => {
                try {
                    const stages = await GrantStageApi.getAll({
                        grant
                    });
                    setCurrentStage(data);
                } catch (error) {
                    console.error("Failed to fetch first stage", error);
                } finally {
                }
            };
            fetctNextStage();
        }, [stages]);
    
    
    
        const [currentStage, setCurrentStage] = useState<ProjectStage>();
    
        useEffect(() => {
            const fetchCurrentStage = async () => {
                if (!project?.currentStage) return;
                try {
                    const data = await ProjectStageApi.getById!(project.currentStage);
                    setCurrentStage(data);
                } catch (error) {
                    console.error("Failed to fetch first stage", error);
                } finally {
                }
            };
            fetchCurrentStage();
        }, [project?.currentStage]);
    
        */



    // 1. Determine if the project is in a state that allows new submissions/stages

    const canCreateStage = project && (
        project.status === ProjectStatus.draft ||
        project.status === ProjectStatus.submitted
    );

    const columns = useMemo(() => {
        const cols: any[] = [];

        if (!project) {
            cols.push({
                header: "Project",
                field: "project.title",
                sortable: true,
                body: (ps: ProjectStage) => {
                    const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                    return (
                        <div className="truncate text-sm font-medium" style={{ maxWidth: '300px' }} title={title}>
                            {title}
                        </div>
                    );
                }
            });

            cols.push({
                header: "Applicant",
                field: "project.applicant.name",
                sortable: true,
                body: (ps: ProjectStage) => {
                    const name = (ps.project as any)?.applicant?.name ?? "N/A";
                    return <span className="text-sm">{name}</span>;
                }
            });
        }

        if (project && !grantStage && !callStage) {
            cols.push({
                header: "Grant Stage",
                field: "grantStage.name",
                body: (ps: ProjectStage) =>
                    typeof ps.grantStage === "object"
                        ? (ps.grantStage as GrantStage)?.name
                        : "General"
            });
        }

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
                        <i className="pi pi-file-pdf mr-1 text-red-500"></i> View PDF
                    </a>
                ) : <span className="text-gray-400 italic">No document</span>
            },
            {
                header: "Score",
                field: "totalScore",
                sortable: true,
                body: (ps: ProjectStage) => (
                    <span className="font-bold text-lg">
                        {typeof ps?.totalScore === "number" ? ps.totalScore : "—"}
                    </span>
                )
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

    const Manager = useMemo(() =>
        createEntityManager<ProjectStage, GetProjectStageOptions | undefined>({
            title: "Project Submissions",
            itemName: "Application Stage",
            api: ProjectStageApi,
            columns: columns,

            // 2. Gate creation: Only if project is in Draft/Submitted
            createNew: canCreateStage
                ? () => createEmptyProjectStage({ project: typeof project === 'object' ? project._id : project })
                : undefined,

            // 3. Gate the Dialog: Prevent pop-up if the project is locked
            SaveDialog: canCreateStage ? SaveProjectStage : undefined,

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
            expandable: {
                template: (ps) => <ProjectStageDetail projectStage={ps} hideReviewer={hideReviewer} />
            },
            //onItemsChange: setStages,
            extraActions: [
                {
                    icon: "pi pi-calculator",
                    severity: "info",
                    tooltip: "Recalculate Scores",
                    permissions: ["project.stage:calculateTotalScore"],
                    onClick: (row: ProjectStage) => {
                        confirm.ask({
                            operation: "calculate score",
                            onConfirmAsync: async () => {
                                const score = await ProjectStageApi.calculateTotalScore(row._id!);
                                row.totalScore = score;
                            }
                        });
                    }
                }
            ],
            hideEditAction: true, // Stages are usually fixed once submitted; updates happen via workflow
            hideDeleteAction: !project,
            disableDeleteRow: (ps: ProjectStage) => ps.status !== ProjectStageStatus.submitted

        }),
        [columns, project, grantStage, grantAllocation, canCreateStage, hideReviewer]
    );

    return <Manager />;
};

export default ProjectStageManager;