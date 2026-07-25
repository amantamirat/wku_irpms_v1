import { ApplicationStatus } from "./application.model";

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
    ApplicationStatus.pending,
    ApplicationStatus.accepted,
    ApplicationStatus.rejected
];

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.pending]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.pending],
    [ApplicationStatus.rejected]: [ApplicationStatus.pending]
};

