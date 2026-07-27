'use client';

import { BASE_URL } from "@/api/ApiClient";
import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { createEntityManager } from "@/components/createEntityManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import MyBadge from "@/templates/MyBadge";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Project, ProjectStatus } from "../../models/project.model";
import { ApplicationApi } from "../api/application.api";
import { Application, ApplicationStatus, createEmptyApplication, GetProjectApplicationOptions } from "../models/application.model";
import { APPLICATION_STATUS_ORDER, APPLICATION_TRANSITIONS } from "../models/application.state-machine";
import ApplicationDetail from "./ApplicationDetail";
import SaveProjectApplication from "./SaveApplication";
import { StageApi } from "@/app/(main)/calls/stages/api/stage.api";

interface ApplicationManagerProps {
    project?: Project;
    stage?: string | Stage;
    callStage?: string | Stage;
    hideReviewer?: boolean;
    updateProject?: (project: Project) => void;
}

const ApplicationManager = ({ project, stage: grantStage, callStage, hideReviewer, updateProject }: ApplicationManagerProps) => {
    const confirm = useConfirmDialog();

    const [stages, setStages] = useState<Stage[] | null>(null);
    const [currentProjectStage, setCurrentProjectStage] = useState<Application | undefined>(undefined);

    // 1. Fetch all GrantStages for the project's grant
    useEffect(() => {
        if (!project?.grant) return;
        StageApi.getAll({ call: project?.call })
            .then(setStages)
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
                    const stage = await ApplicationApi.getById!(project.currentStage);
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
        if (!stages?.length) return undefined;

        // Special Case: If project is completed, the "next" stage is the verification stage (order 0)
        if (project?.status === ProjectStatus.completed) {
            return stages.find(gs => gs.order === 0);
        }

        let currentOrder = 0;

        // If we have the full loaded currentProjectStage, find its grantStage order
        if (currentProjectStage) {
            const currentGrantStageId = typeof currentProjectStage.stage === 'object'
                ? currentProjectStage.stage?._id
                : currentProjectStage.stage;

            const currentGSObj = stages.find(gs => gs._id === currentGrantStageId);
            if (currentGSObj) {
                currentOrder = currentGSObj.order || 0;
            }
        }

        // Standard progression: find the stage with the next incremented order
        // Note: We usually filter out order 0 here if it's reserved strictly for verification
        return stages.find(gs => gs.order === currentOrder + 1);
    }, [stages, currentProjectStage, project?.status]);

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
    const handleItemsChange = useCallback((projectStages: Application[]) => {
        const currentProject = projectRef.current;
        if (!currentProject || !updateProjectRef.current) return;

        // 2. Determine New Status based on Phase logic
        let newStatus = currentProject.status;

        if (projectStages.length > 0) {


            if (projectStages.some(p => p.status === ApplicationStatus.rejected)) {
                newStatus = ProjectStatus.rejected;
            }
            else if (projectStages.some(p => p.status === ApplicationStatus.pending)) {
                newStatus = ProjectStatus.submitted;
            }
            else if (projectStages.every(p => p.status === ApplicationStatus.accepted)
                && projectStages.length === stages?.length
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
    }, [project, stages]);

    const columns = useMemo(() => {
        const cols: any[] = [];
        if (!project) {
            cols.push({
                header: "Project",
                field: "project.title",
                body: (ps: Application) => {
                    const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                    return <div className="truncate text-sm font-medium" style={{ maxWidth: '300px' }} title={title}>{title}</div>;
                }
            });
        }
        if (project && !grantStage && !callStage) {
            cols.push({
                header: "Stage Name",
                body: (ps: Application) => typeof ps.stage === "object" ? (ps.stage as Stage)?.name : "General"
            });
        }
        cols.push(
            {
                header: "Document",
                body: (ps: Application) => ps.documentPath ? (
                    <a href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        <i className="pi pi-file-pdf mr-1 text-red-500"></i> View PDF
                    </a>
                ) : <span className="text-gray-400 italic">No document</span>
            },
            {
                header: "Score",
                body: (ps: Application) => <span className="font-bold text-lg">{typeof ps?.totalScore === "number" ? ps.totalScore : "—"}</span>
            },
            {
                header: "Status",
                body: (ps: Application) => <MyBadge type="status" value={ps.status ?? ApplicationStatus.pending} />
            }
        );
        return cols;
    }, [project, grantStage, callStage]);

    const Manager = useMemo(() =>
        createEntityManager<Application, GetProjectApplicationOptions | undefined>({
            title: nextStage ? `Submit ${nextStage.name}` : "Applications",
            itemName: nextStage ? nextStage.name : "Application",
            api: ApplicationApi,
            columns: columns,
            onItemsChange: handleItemsChange,
            createNew: (canCreateStage && nextStage)
                ? () => createEmptyApplication({
                    project: project,
                    stage: nextStage
                })
                : undefined,

            SaveDialog: canCreateStage ? SaveProjectApplication : undefined,
            permissionPrefix: "project.application",
            query: () => ({
                project: project,
                stage: typeof grantStage === "object" ? grantStage._id : grantStage,
                populate: true
            }),
            workflow: {
                statusField: "status",
                statusOrder: APPLICATION_STATUS_ORDER,
                transitions: APPLICATION_TRANSITIONS
            },
            expandable: {
                template: (ps) => <ApplicationDetail application={ps} hideReviewer={hideReviewer} />
            },
            extraActions: [
                {
                    icon: "pi pi-calculator",
                    severity: "info",
                    tooltip: "Recalculate Scores",
                    permissions: ["project.stage:calculateTotalScore"],
                    onClick: (row: Application) => {
                        confirm.ask({
                            operation: "calculate score",
                            onConfirmAsync: async () => {
                                const score = await ApplicationApi.calculateTotalScore(row._id!);
                                row.totalScore = score;
                            }
                        });
                    }
                }
            ],
            hideEditAction: true,
            //hideDeleteAction: !project,
            disableDeleteRow: (ps: Application) => ps.status !== ApplicationStatus.pending
        }),
        [columns, project, grantStage, canCreateStage, nextStage]
    );

    return <Manager />;
};

export default ApplicationManager;