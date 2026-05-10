import { ProjectStageStatus } from "./project.stage.model";

export const PROJECT_STAGE_STATUS_ORDER: ProjectStageStatus[] = [
    ProjectStageStatus.submitted,
    //ProjectStageStatus.shortlisted,
    //ProjectStageStatus.refused,
    //ProjectStageStatus.reviewed,
    ProjectStageStatus.accepted,
    ProjectStageStatus.rejected
];




export const PROJECT_STAGE_TRANSITIONS: Record<ProjectStageStatus, ProjectStageStatus[]> = {
    [ProjectStageStatus.submitted]: [ProjectStageStatus.accepted, ProjectStageStatus.rejected],
    [ProjectStageStatus.accepted]: [ProjectStageStatus.submitted],
    [ProjectStageStatus.rejected]: [ProjectStageStatus.submitted]
};

