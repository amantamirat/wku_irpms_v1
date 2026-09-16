import { ApplicationStatus } from "./application.model";

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
    ApplicationStatus.pending,
    ApplicationStatus.accepted,
    ApplicationStatus.rejected
];

export const APP_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.pending]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.pending],
    [ApplicationStatus.rejected]: [ApplicationStatus.pending]
};


import { TransitionMap } from "@/hooks/useStateTransitionActions";


export const APPLICATION_TRANSITIONS: TransitionMap = {
    [ApplicationStatus.pending]: [
        {
            next: ApplicationStatus.accepted,
            action: "Accept",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: ApplicationStatus.rejected,
            action: "Reject",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [ApplicationStatus.accepted]: [
        {
            next: ApplicationStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [ApplicationStatus.rejected]: [
        {
            next: ApplicationStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ]
};

