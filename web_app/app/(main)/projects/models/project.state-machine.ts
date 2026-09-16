import { ProjectStatus } from "./project.model";

import { TransitionMap } from "@/hooks/useStateTransitionActions";

export const PROJECT_TRANSITIONS: TransitionMap = {
    [ProjectStatus.draft]: [
        {
            next: ProjectStatus.approved,
            action: "Approve",
            icon: "pi pi-check",
            severity: "success",
        },
        {
            next: ProjectStatus.refused,
            action: "Refuse",
            icon: "pi pi-times",
            severity: "danger",
        },
    ],

    [ProjectStatus.approved]: [
        {
            next: ProjectStatus.granted,
            action: "Grant",
            icon: "pi pi-check-circle",
            severity: "success",
        },
        {
            next: ProjectStatus.draft,
            action: "Set Draft",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [ProjectStatus.refused]: [
        {
            next: ProjectStatus.draft,
            action: "Set Draft",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [ProjectStatus.granted]: [
        {
            next: ProjectStatus.completed,
            action: "Complete",
            icon: "pi pi-check-circle",
            severity: "success",
        },
        {
            next: ProjectStatus.approved,
            action: "Set Approved",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],

    [ProjectStatus.completed]: [
        {
            next: ProjectStatus.granted,
            action: "Set Granted",
            icon: "pi pi-undo",
            severity: "warning",
        },
    ],
};