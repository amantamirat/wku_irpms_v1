import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { CallStatus } from "./call.model";


export const CALL_TRANSITIONS: TransitionMap = {
    [CallStatus.planned]: [
        {
            next: CallStatus.active,
            action: "Activate",
            icon: "pi pi-play",
            severity: "success"
        }
    ],

    [CallStatus.active]: [
        {
            next: CallStatus.closed,
            action: "Close",
            icon: "pi pi-times",
            severity: "danger"
        },
        {
            next: CallStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [CallStatus.closed]: [
        {
            next: CallStatus.active,
            action: "Reopen",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ]
};