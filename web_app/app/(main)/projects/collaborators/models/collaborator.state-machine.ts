import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { CollaboratorStatus } from "./collaborator.model";

/*
export const COLLAB_STATUS_ORDER: CollaboratorStatus[] = [
    CollaboratorStatus.pending,
    CollaboratorStatus.verified
];

export const COLLAB_TRANSITIONS: Record<CollaboratorStatus, CollaboratorStatus[]> = {
    [CollaboratorStatus.pending]: [CollaboratorStatus.verified],
    [CollaboratorStatus.verified]: [CollaboratorStatus.pending]
};*/

export const COLLABORATION_TRANSITIONS: TransitionMap = {
    [CollaboratorStatus.pending]: [
        {
            next: CollaboratorStatus.verified,
            action: "Verify",
            icon: "pi pi-check",
            severity: "success"
        },
        {
            next: CollaboratorStatus.declined,
            action: "Decline",
            icon: "pi pi-times",
            severity: "danger"
        }
    ],

    [CollaboratorStatus.verified]: [
        {
            next: CollaboratorStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [CollaboratorStatus.declined]: [
        {
            next: CollaboratorStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ]
};