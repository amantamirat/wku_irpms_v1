import { ApplicationStatus } from "./project.application.model";

export const PROJECT_STAGE_STATUS_ORDER: ApplicationStatus[] = [
    ApplicationStatus.submitted,
    //ProjectStageStatus.shortlisted,
    //ProjectStageStatus.refused,
    //ProjectStageStatus.reviewed,
    ApplicationStatus.accepted,
    ApplicationStatus.rejected
];




export const PROJECT_STAGE_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.submitted]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.submitted],
    [ApplicationStatus.rejected]: [ApplicationStatus.submitted]
};

