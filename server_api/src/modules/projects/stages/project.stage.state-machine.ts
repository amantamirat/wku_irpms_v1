import { ProjectStageStatus } from "./project.stage.status";


export const PROJECT_STAGE_TRANSITIONS: Record<ProjectStageStatus, ProjectStageStatus[]> = {
    [ProjectStageStatus.submitted]: [ProjectStageStatus.selected, ProjectStageStatus.accepted, ProjectStageStatus.rejected],
    [ProjectStageStatus.selected]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted],
    [ProjectStageStatus.reviewed]: [ProjectStageStatus.accepted, ProjectStageStatus.rejected, ProjectStageStatus.selected],
    [ProjectStageStatus.accepted]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted],
    [ProjectStageStatus.rejected]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted]
};

