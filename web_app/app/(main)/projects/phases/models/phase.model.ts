import { IStatusHistory } from "@/components/StatusHistoryWidget";
import { Project } from "../../models/project.model";

export enum PhaseStatus {
    proposed = 'proposed',
    approved = 'approved',
    refused = 'refused',
    active = 'active',
    completed = 'completed',
    cancelled = 'cancelled',
}

export type Phase = {
    _id?: string;
    project?: string | Project;
    title: string;
    duration: number;           // Total duration
    budget: number;             // Total budget
    description?: string;       // Optional
    status?: PhaseStatus;
    statusHistory?: IStatusHistory<PhaseStatus>[];
    createdAt?: Date;
    updatedAt?: Date;
};

export interface FilterPhaseOptions {
    project?: string | Project;
}

// --- Validation Logic ---
export const validatePhase = (phase: Phase): { valid: boolean; message?: string } => {
    if (!phase.project) {
        return { valid: false, message: 'Project is required.' };
    }

    if (!phase.title || phase.title.trim() === '') {
        return { valid: false, message: 'Title is required.' };
    }

    if (!phase.duration || phase.duration <= 0) {
        return { valid: false, message: 'Total duration must be greater than 0.' };
    }

    if (phase.budget === undefined || phase.budget < 0) {
        return { valid: false, message: 'A valid budget is required.' };
    }

    return { valid: true };
};