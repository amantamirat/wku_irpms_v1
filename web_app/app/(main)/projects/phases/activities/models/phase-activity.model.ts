import { Phase } from "../../models/phase.model";


export enum PhaseActivityStatus {
    planned = "planned",
    approved = 'approved',
    refused = 'refused',
    active = "active",
    completed = "completed",
    cancelled = "cancelled",
}

export type PhaseActivity = {
    _id?: string;
    phase: string | Phase;
    title: string;
    description?: string;
    participants?: number;
    startDate?: Date;
    endDate?: Date;
    //requiredDays?: number;
    cost: number;
    status?: PhaseActivityStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface FilterPhaseActivityOptions {
    phase?: string | Phase;
    status?: PhaseActivityStatus;
}

// --- Validation Logic ---
export const validatePhaseActivity = (activity: PhaseActivity): { valid: boolean; message?: string } => {
    if (!activity.phase) {
        return { valid: false, message: 'Phase is required.' };
    }

    if (!activity.title || activity.title.trim() === '') {
        return { valid: false, message: 'Activity title is required.' };
    }

    if (!activity.startDate) {
        return { valid: false, message: 'Start date is required.' };
    }

    if (!activity.endDate) {
        return { valid: false, message: 'End date is required.' };
    }

    if (new Date(activity.startDate) > new Date(activity.endDate)) {
        return { valid: false, message: 'Start date cannot be after the end date.' };
    }

    if (activity.cost === undefined || activity.cost < 0) {
        return { valid: false, message: 'A valid cost is required.' };
    }

    /*
    if (activity.requiredDays !== undefined && activity.requiredDays < 0) {
        return { valid: false, message: 'Required days cannot be negative.' };
    }*/

    return { valid: true };
};