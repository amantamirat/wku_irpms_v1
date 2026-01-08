import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CalendarStatus } from "./calendar.status";

// calendar.state-machine.ts
export class CalendarStateMachine {
    
    private static readonly transitions: Record<CalendarStatus, CalendarStatus[]> = {
        [CalendarStatus.planned]: [CalendarStatus.active],
        [CalendarStatus.active]: [CalendarStatus.closed, CalendarStatus.planned],
        [CalendarStatus.closed]: [CalendarStatus.active]
    };

    static canTransition(from: CalendarStatus, to: CalendarStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: CalendarStatus, to: CalendarStatus): void {
        if (!this.canTransition(from, to)) {
            throw new AppError(ERROR_CODES.CALENDAR_INVALID_STATE_TRANSITION);
        }
    }

    static getAllowedTransitions(from: CalendarStatus): CalendarStatus[] {
        return this.transitions[from] ?? [];
    }
}