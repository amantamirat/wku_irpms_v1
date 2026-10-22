import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { StageStatus } from "./stage.model";

export const STAGE_TRANSITIONS: TransitionMap = {
    [StageStatus.pending]: [
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
            next: StageStatus.pending,
            action: "Set Pending",
            icon: "pi pi-undo",
            severity: "info"
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