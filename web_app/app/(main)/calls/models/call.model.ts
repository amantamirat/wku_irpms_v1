import { Calendar } from "../../calendars/models/calendar.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";

export enum CallStatus {
    planned = 'Planned',
    active = 'Active',
    closed = 'Closed',
    locked = 'Locked'
}
export type Call = {
    _id?: string;
    directorate: string | Organization;
    calendar: string | Calendar;
    title: string;
    deadline: Date;
    description?: string | null;
    total_budget?: number;
    poster?: string | null;
    grant: string | Grant;
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

    if (!call.grant) {
        return { valid: false, message: 'Grant is required.' };
    }

    const deadlineDate = new Date(call.deadline);
    if (!call.deadline || isNaN(deadlineDate.getTime())) {
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