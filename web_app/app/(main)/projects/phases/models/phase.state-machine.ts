// --- Helpers & Constants ---

import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { PhaseStatus } from "./phase.model";

/*
export const PHASE_STATUS_ORDER: PhaseStatus[] = [
    PhaseStatus.proposed,
    PhaseStatus.approved,
    PhaseStatus.active,
    PhaseStatus.terminated,
    PhaseStatus.completed
];

export const PH_TRANS: Record<PhaseStatus, PhaseStatus[]> = {
    [PhaseStatus.proposed]: [
        PhaseStatus.approved
    ],

    [PhaseStatus.approved]: [
        PhaseStatus.active,
        PhaseStatus.proposed
    ],

    [PhaseStatus.active]: [
        PhaseStatus.completed,
        PhaseStatus.terminated,
        PhaseStatus.approved
    ],

    [PhaseStatus.completed]: [
        PhaseStatus.active
    ],

    [PhaseStatus.terminated]: [
        PhaseStatus.active
    ]
};
*/

export const PHASE_TRANSITIONS: TransitionMap = {
    [PhaseStatus.proposed]: [
        {
            next: PhaseStatus.approved,
            action: "Approve",
            icon: "pi pi-check",
            severity: "success"
        }
    ],

    [PhaseStatus.approved]: [
        {
            next: PhaseStatus.active,
            action: "Activate",
            icon: "pi pi-play",
            severity: "success"
        },
        {
            next: PhaseStatus.proposed,
            action: "Set Proposed",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [PhaseStatus.active]: [
        {
            next: PhaseStatus.completed,
            action: "Complete",
            icon: "pi pi-check-circle",
            severity: "success"
        },
        {
            next: PhaseStatus.terminated,
            action: "Terminate",
            icon: "pi pi-times",
            severity: "danger"
        },
        {
            next: PhaseStatus.approved,
            action: "Set Approved",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [PhaseStatus.completed]: [
        {
            next: PhaseStatus.active,
            action: "Reopen",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ],

    [PhaseStatus.terminated]: [
        {
            next: PhaseStatus.active,
            action: "Reactivate",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ]
};