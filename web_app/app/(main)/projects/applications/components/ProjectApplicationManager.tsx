'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASE_URL } from "@/api/ApiClient";
import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { GrantAllocation } from "@/app/(main)/grants/allocations/models/grant.allocation.model";
import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Project, ProjectStatus } from "../../models/project.model";
import { ProjectApplicationApi } from "../api/project.stage.api";
import { GetProjectApplicationOptions, ProjectApplication, ApplicationStatus, createEmptyProjectApplication } from "../models/project.application.model";
import { PROJECT_STAGE_STATUS_ORDER, PROJECT_STAGE_TRANSITIONS } from "../models/application.state-machine";
import ProjectStageDetail from "./ProjectApplicationDetail";
import SaveProjectApplication from "./SaveProjectApplication";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { GrantStageApi } from "@/app/(main)/grants/stages/api/grant.stage.api";

interface ProjectApplicationManagerProps {
    project?: Project;
    grantStage?: string | GrantStage;
    callStage?: string | Stage;
    hideReviewer?: boolean;
    updateProject?: (project: Project) => void;
}

const ProjectApplicationManager = ({ project, grantStage, callStage, hideReviewer, updateProject }: ProjectApplicationManagerProps) => {
    const confirm = useConfirmDialog();

    const [grantStages, setGrantStages] = useState<GrantStage[] | null>(null);
    const [currentProjectStage, setCurrentProjectStage] = useState<ProjectApplication | undefined>(undefined);

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
                    const stage = await ProjectApplicationApi.getById!(project.currentStage);
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

    const projectRef = useRef(project);
    projectRef.current = project;

    const updateProjectRef = useRef(updateProject);
    updateProjectRef.current = updateProject;

    // 💡 FIX 2: Safely compute state transformations using the mutable ref
    const handleItemsChange = useCallback((projectStages: ProjectApplication[]) => {
        const currentProject = projectRef.current;
        if (!currentProject || !updateProjectRef.current) return;

        // 2. Determine New Status based on Phase logic
        let newStatus = currentProject.status;

        if (projectStages.length > 0) {


            if (projectStages.some(p => p.status === ApplicationStatus.rejected)) {
                newStatus = ProjectStatus.rejected;
            }
            else if (projectStages.some(p => p.status === ApplicationStatus.submitted)) {
                newStatus = ProjectStatus.submitted;
            }
            else if (projectStages.every(p => p.status === ApplicationStatus.accepted)
                && projectStages.length === grantStages?.length
            ) {
                newStatus = ProjectStatus.accepted;
            }
        }
        const hasStatusChanged = currentProject.status !== newStatus;

        if (hasStatusChanged) {
            updateProjectRef.current({
                ...currentProject, // Uses the fresh instance! No dropped state.
                status: newStatus
            });
        }
    }, [project, grantStages]);

    const columns = useMemo(() => {
        const cols: any[] = [];
        if (!project) {
            cols.push({
                header: "Project",
                field: "project.title",
                body: (ps: ProjectApplication) => {
                    const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                    return <div className="truncate text-sm font-medium" style={{ maxWidth: '300px' }} title={title}>{title}</div>;
                }
            });
        }
        if (project && !grantStage && !callStage) {
            cols.push({
                header: "Stage Name",
                body: (ps: ProjectApplication) => typeof ps.grantStage === "object" ? (ps.grantStage as GrantStage)?.name : "General"
            });
        }
        cols.push(
            {
                header: "Document",
                body: (ps: ProjectApplication) => ps.documentPath ? (
                    <a href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        <i className="pi pi-file-pdf mr-1 text-red-500"></i> View PDF
                    </a>
                ) : <span className="text-gray-400 italic">No document</span>
            },
            {
                header: "Score",
                body: (ps: ProjectApplication) => <span className="font-bold text-lg">{typeof ps?.totalScore === "number" ? ps.totalScore : "—"}</span>
            },
            {
                header: "Status",
                body: (ps: ProjectApplication) => <MyBadge type="status" value={ps.status ?? ApplicationStatus.submitted} />
            }
        );
        return cols;
    }, [project, grantStage, callStage]);

    const Manager = useMemo(() =>
        createEntityManager<ProjectApplication, GetProjectApplicationOptions | undefined>({
            title: nextStage ? `Submit ${nextStage.name}` : "Applications",
            itemName: nextStage ? nextStage.name : "Application",
            api: ProjectApplicationApi,
            columns: columns,
            onItemsChange: handleItemsChange,
            createNew: (canCreateStage && nextStage)
                ? () => createEmptyProjectApplication({
                    project: project,
                    grantStage: nextStage
                })
                : undefined,

            SaveDialog: canCreateStage ? SaveProjectApplication : undefined,
            permissionPrefix: "project.application",
            query: () => ({
                project: project,
                grantStage: typeof grantStage === "object" ? grantStage._id : grantStage,
                populate: true
            }),
            workflow: {
                statusField: "status",
                statusOrder: PROJECT_STAGE_STATUS_ORDER,
                transitions: PROJECT_STAGE_TRANSITIONS
            },
            expandable: {
                template: (ps) => <ProjectStageDetail projectApplication={ps} hideReviewer={hideReviewer} />
            },
            extraActions: [
                {
                    icon: "pi pi-calculator",
                    severity: "info",
                    tooltip: "Recalculate Scores",
                    permissions: ["project.stage:calculateTotalScore"],
                    onClick: (row: ProjectApplication) => {
                        confirm.ask({
                            operation: "calculate score",
                            onConfirmAsync: async () => {
                                const score = await ProjectApplicationApi.calculateTotalScore(row._id!);
                                row.totalScore = score;
                            }
                        });
                    }
                }
            ],
            hideEditAction: true,
            hideDeleteAction: !project,
            disableDeleteRow: (ps: ProjectApplication) => ps.status !== ApplicationStatus.submitted
        }),
        [columns, project, grantStage, canCreateStage, nextStage]
    );

    return <Manager />;
};

export default ProjectApplicationManager;