import { Calendar } from "./calendar";

export enum CallStatus {
    Planned = 'Planned',
    Active = 'Active',
    Closed = 'Closed',
    Locked = 'Locked'
}

export type Call = {
    _id?: string;
    directorate: string ;
    calendar: string | Calendar;
    title: string;
    dead_line: Date;
    description?: string;
    max_total_allocated_budget?: number;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateCall = (
    call: Call
): { valid: boolean; message?: string } => {
    if (!call.title || call.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }

    if (!call.directorate || (typeof call.directorate === 'string' && call.directorate.trim() === '')) {
        return { valid: false, message: 'Directorate is required.' };
    }

    if (!call.calendar) {
        return { valid: false, message: 'Calendar is required.' };
    }

    if (!call.dead_line || isNaN(new Date(call.dead_line).getTime())) {
        return { valid: false, message: 'Deadline must be a valid date.' };
    }

    // If calendar is an object with valid start_date and end_date
    if (typeof call.calendar === 'object' && call.calendar.start_date && call.calendar.end_date) {
        const deadline = new Date(call.dead_line).getTime();
        const start = new Date(call.calendar.start_date).getTime();
        const end = new Date(call.calendar.end_date).getTime();

        if (deadline < start || deadline > end) {
            return {
                valid: false,
                message: `Deadline must be between ${call.calendar.start_date.toDateString()} and ${call.calendar.end_date.toDateString()}.`
            };
        }
    }

    if (!call.status) {
        return { valid: false, message: 'Status is required.' };
    }

    if (
        call.max_total_allocated_budget !== undefined &&
        (isNaN(call.max_total_allocated_budget) || call.max_total_allocated_budget < 0)
    ) {
        return { valid: false, message: 'Allocated budget must be a non-negative number.' };
    }

    return { valid: true };
};