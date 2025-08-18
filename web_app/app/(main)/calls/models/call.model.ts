import { Calendar } from "@/models/calendar";

export enum CallStatus {
    planned = 'Planned',
    active = 'Active',
    closed = 'Closed',
    locked = 'Locked'
}
export type Call = {
    _id?: string;
    directorate: string;
    calendar: string | Calendar;
    title: string;
    dead_line: Date;
    description?: string;
    total_budget?: number;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}


export const validateCall = (call: Call): { valid: boolean; message?: string } => {
    if (!call.title || call.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    if (!call.directorate) {
        return { valid: false, message: 'Directorate is required.' };
    }

    if (!call.calendar) {
        return { valid: false, message: 'Calendar is required.' };
    }

    const deadlineDate = new Date(call.dead_line);
    if (!call.dead_line || isNaN(deadlineDate.getTime())) {
        return { valid: false, message: 'Deadline must be a valid date.' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
        return { valid: false, message: 'Deadline must be today or later.' };
    }

    if (!call.status) {
        return { valid: false, message: 'Status is required.' };
    }
    return { valid: true };
};