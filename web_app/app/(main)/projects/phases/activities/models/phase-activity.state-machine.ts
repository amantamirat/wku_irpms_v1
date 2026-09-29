import { PhaseActivityStatus } from "./phase-activity.model";

import { TransitionMap } from "@/hooks/useStateTransitionActions";

export const PHASE_ACTIVITY_TRANSITIONS: TransitionMap = {
    [PhaseActivityStatus.planned]: [
        {
            next: PhaseActivityStatus.approved,
            action: "Approve",
            icon: "pi pi-check",
            severity: "success",
        },
        {
            next: PhaseActivityStatus.refused,
            action: "Refuse",
            icon: "pi pi-times",
            severity: "danger",
        },
    ],

    [PhaseActivityStatus.approved]: [
        {
            next: PhaseActivityStatus.active,
            action: "Activate",
            icon: "pi pi-play",
            severity: "success",
        },
        {
            next: PhaseActivityStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [PhaseActivityStatus.refused]: [
        {
            next: PhaseActivityStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [PhaseActivityStatus.active]: [
        {
            next: PhaseActivityStatus.completed,
            action: "Complete",
            icon: "pi pi-check-circle",
            severity: "success",
        },
        {
            next: PhaseActivityStatus.cancelled,
            action: "Cancel",
            icon: "pi pi-ban",
            severity: "danger",
        },
        {
            next: PhaseActivityStatus.approved,
            action: "Set Approved",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [PhaseActivityStatus.completed]: [
        {
            next: PhaseActivityStatus.active,
            action: "Set Active",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [PhaseActivityStatus.cancelled]: [
        {
            next: PhaseActivityStatus.active,
            action: "Set Active",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],
};