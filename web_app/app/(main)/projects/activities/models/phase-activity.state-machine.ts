import { ActivityStatus } from "./phase-activity.model";

import { TransitionMap } from "@/hooks/useStateTransitionActions";

export const PHASE_ACTIVITY_TRANSITIONS: TransitionMap = {
    [ActivityStatus.planned]: [
        {
            next: ActivityStatus.approved,
            action: "Approve",
            icon: "pi pi-check",
            severity: "success",
        },
        {
            next: ActivityStatus.refused,
            action: "Refuse",
            icon: "pi pi-times",
            severity: "danger",
        },
    ],

    [ActivityStatus.approved]: [
        {
            next: ActivityStatus.active,
            action: "Activate",
            icon: "pi pi-play",
            severity: "success",
        },
        {
            next: ActivityStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [ActivityStatus.refused]: [
        {
            next: ActivityStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [ActivityStatus.active]: [
        {
            next: ActivityStatus.completed,
            action: "Complete",
            icon: "pi pi-check-circle",
            severity: "success",
        },
        {
            next: ActivityStatus.cancelled,
            action: "Cancel",
            icon: "pi pi-ban",
            severity: "danger",
        },
        {
            next: ActivityStatus.approved,
            action: "Set Approved",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [ActivityStatus.completed]: [
        {
            next: ActivityStatus.active,
            action: "Set Active",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [ActivityStatus.cancelled]: [
        {
            next: ActivityStatus.active,
            action: "Set Active",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],
};