import { TransitionAction } from "@/hooks/useStateTransitionActions";

export enum GrantStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export const GRANT_TRANSITIONS: Record<GrantStatus, TransitionAction[]> = {
    [GrantStatus.planned]: [
        {
            next: GrantStatus.active,
            action: "Activate",
            icon: "pi pi-play",
            severity: "success",
            //requireReason: false
        }
    ],
    [GrantStatus.active]: [
        {
            next: GrantStatus.closed,
            action: "Close",
            icon: "pi pi-lock",
            severity: "danger",
            //requireReason: true
        },
        {
            next: GrantStatus.planned,
            action: "Revert to Planned",
            icon: "pi pi-history",
            severity: "warning",
            requireReason: true
        }
    ],
    [GrantStatus.closed]: [
        {
            next: GrantStatus.active,
            action: "Reactivate",
            icon: "pi pi-unlock",
            severity: "info",
            //requireReason: true
        }
    ]
};