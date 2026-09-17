import { ApplicationStatus } from "./application.model";
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

