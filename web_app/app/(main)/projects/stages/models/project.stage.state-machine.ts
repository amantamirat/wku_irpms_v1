import { ProjectStageStatus } from "./project.stage.model";

export const PROJECT_STAGE_STATUS_ORDER: ProjectStageStatus[] = [
    ProjectStageStatus.submitted,
    ProjectStageStatus.shortlisted,
    ProjectStageStatus.refused,
    ProjectStageStatus.reviewed,
    ProjectStageStatus.accepted,
    ProjectStageStatus.rejected
];

export const PROJECT_STAGE_TRANSITIONS: Record<ProjectStageStatus, ProjectStageStatus[]> = {
    [ProjectStageStatus.submitted]: [ProjectStageStatus.shortlisted, ProjectStageStatus.refused],
    [ProjectStageStatus.shortlisted]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted],
    [ProjectStageStatus.refused]: [ProjectStageStatus.submitted],
    [ProjectStageStatus.reviewed]: [ProjectStageStatus.accepted, ProjectStageStatus.rejected, ProjectStageStatus.shortlisted],
    [ProjectStageStatus.accepted]: [ProjectStageStatus.reviewed],
    [ProjectStageStatus.rejected]: [ProjectStageStatus.reviewed]
};

