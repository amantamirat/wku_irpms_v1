'use client';

import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "@/api/ApiClient";
import { CallStage } from "@/app/(main)/calls/stages/models/call.stage.model";
import { GrantAllocation } from "@/app/(main)/grants/allocations/models/grant.allocation.model";
import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Project, ProjectStatus } from "../../models/project.model";
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

    const [grantStages, setGrantStages] = useState<GrantStage[] | null>(null);
    const [currentProjectStage, setCurrentProjectStage] = useState<ProjectStage | undefined>(undefined);

    // 1. Fetch all GrantStages for the project's grant
    useEffect(() => {
        if (!project?.grant) return;
        GrantStageApi.getAll({ grant: project?.grant })
            .then(setGrantStages)
            .catch(err => console.error("Failed to fetch grant stages", err));
    }, [project?.grant]);

    // 2. Load the full current ProjectStage object if it's currently just an ID
    useEffect(() => {
        const loadCurrentStage = async () => {
            try {
                if (!project?.currentStage) {
                    setCurrentProjectStage(undefined);
                    return;
                }

                if (typeof project.currentStage !== "string") {
                    setCurrentProjectStage(project.currentStage);
                } else {
                    const stage = await ProjectStageApi.getById!(project.currentStage);
                    setCurrentProjectStage(stage);
                }
            } catch (error) {
                console.error("Failed to load current project stage", error);
            }
        };

        loadCurrentStage();
    }, [project?.currentStage]);

    // 3. Logic to find the NEXT GrantStage
    const nextStage = useMemo(() => {
        if (!grantStages?.length) return undefined;

        // Special Case: If project is completed, the "next" stage is the verification stage (order 0)
        if (project?.status === ProjectStatus.completed) {
            return grantStages.find(gs => gs.order === 0);
        }

        let currentOrder = 0;

        // If we have the full loaded currentProjectStage, find its grantStage order
        if (currentProjectStage) {
            const currentGrantStageId = typeof currentProjectStage.grantStage === 'object'
                ? currentProjectStage.grantStage?._id
                : currentProjectStage.grantStage;

            const currentGSObj = grantStages.find(gs => gs._id === currentGrantStageId);
            if (currentGSObj) {
                currentOrder = currentGSObj.order || 0;
            }
        }

        // Standard progression: find the stage with the next incremented order
        // Note: We usually filter out order 0 here if it's reserved strictly for verification
        return grantStages.find(gs => gs.order === currentOrder + 1);
    }, [grantStages, currentProjectStage, project?.status]);

    const canCreateStage = project && (
        project.status === ProjectStatus.draft ||
        project.status === ProjectStatus.submitted ||
        project.status === ProjectStatus.completed // This allows the verification stage to be created
    );

    const columns = useMemo(() => {
        const cols: any[] = [];
        if (!project) {
            cols.push({
                header: "Project",
                field: "project.title",
                body: (ps: ProjectStage) => {
                    const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                    return <div className="truncate text-sm font-medium" style={{ maxWidth: '300px' }} title={title}>{title}</div>;
                }
            });
        }
        if (project && !grantStage && !callStage) {
            cols.push({
                header: "Stage Name",
                body: (ps: ProjectStage) => typeof ps.grantStage === "object" ? (ps.grantStage as GrantStage)?.name : "General"
            });
        }
        cols.push(
            {
                header: "Document",
                body: (ps: ProjectStage) => ps.documentPath ? (
                    <a href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        <i className="pi pi-file-pdf mr-1 text-red-500"></i> View PDF
                    </a>
                ) : <span className="text-gray-400 italic">No document</span>
            },
            {
                header: "Score",
                body: (ps: ProjectStage) => <span className="font-bold text-lg">{typeof ps?.totalScore === "number" ? ps.totalScore : "—"}</span>
            },
            {
                header: "Status",
                body: (ps: ProjectStage) => <MyBadge type="status" value={ps.status ?? ProjectStageStatus.submitted} />
            }
        );
        return cols;
    }, [project, grantStage, callStage]);

    const Manager = useMemo(() =>
        createEntityManager<ProjectStage, GetProjectStageOptions | undefined>({
            title: nextStage ? `Submit ${nextStage.name}` : "Project Submissions",
            itemName: nextStage ? nextStage.name : "Application Stage",
            api: ProjectStageApi,
            columns: columns,

            createNew: (canCreateStage && nextStage)
                ? () => createEmptyProjectStage({
                    project: project,
                    grantStage: nextStage
                })
                : undefined,

            SaveDialog: canCreateStage ? SaveProjectStage : undefined,
            permissionPrefix: "project.stage",
            query: () => ({
                project: project,
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
            hideEditAction: true,
            hideDeleteAction: !project,
            disableDeleteRow: (ps: ProjectStage) => ps.status !== ProjectStageStatus.submitted
        }),
        [columns, project, grantStage, grantAllocation, canCreateStage, nextStage]
    );

    return <Manager />;
};

export default ProjectStageManager;