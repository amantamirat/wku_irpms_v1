import { TransitionMap } from "@/hooks/useStateTransitionActions";
import { CalendarStatus } from "./calendar.model";


export const CALENDAR_TRANSITIONS: TransitionMap = {
    [CalendarStatus.planned]: [
        {
            next: CalendarStatus.active,
            action: "Activate",
            icon: "pi pi-play",
            severity: "success"
        }
    ],

    [CalendarStatus.active]: [
        {
            next: CalendarStatus.closed,
            action: "Close",
            icon: "pi pi-times",
            severity: "danger"
        },
        {
            next: CalendarStatus.planned,
            action: "Set Planned",
            icon: "pi pi-undo",
            severity: "warning"
        }
    ],

    [CalendarStatus.closed]: [
        {
            next: CalendarStatus.active,
            action: "Reopen",
            icon: "pi pi-refresh",
            severity: "success"
        }
    ]
};