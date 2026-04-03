import { ProjectStageStatus } from "./project.stage.model";

export const PROJECT_STAGE_STATUS_ORDER: ProjectStageStatus[] = [
    ProjectStageStatus.submitted,
    ProjectStageStatus.selected,
    ProjectStageStatus.reviewed,
    ProjectStageStatus.accepted,
    ProjectStageStatus.rejected
];

export const PROJECT_STAGE_TRANSITIONS: Record<ProjectStageStatus, ProjectStageStatus[]> = {
    [ProjectStageStatus.submitted]: [ProjectStageStatus.selected, ProjectStageStatus.accepted, ProjectStageStatus.rejected],
    [ProjectStageStatus.selected]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted],
    [ProjectStageStatus.reviewed]: [ProjectStageStatus.accepted, ProjectStageStatus.rejected, ProjectStageStatus.selected],
    [ProjectStageStatus.accepted]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted],
    [ProjectStageStatus.rejected]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted]
};

