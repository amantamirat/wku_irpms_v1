import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { StageStatus } from "./stage.model";

export const STAGE_TRANSITIONS: TransitionMap = {
    [StageStatus.upcoming]: [
        {
            next: StageStatus.active,
            action: "Activate",
            icon: "pi pi-play",
            severity: "success"
        }
    ],

    [StageStatus.active]: [
        {
            next: StageStatus.closed,
            action: "Close",
            icon: "pi pi-times",
            severity: "danger"
        },
        {
            next: StageStatus.upcoming,
            action: "Set Upcoming",
            icon: "pi pi-undo",
            severity: "secondary"
        }
    ],

    [StageStatus.closed]: [
        {
            next: StageStatus.active,
            action: "Reopen",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ]
};