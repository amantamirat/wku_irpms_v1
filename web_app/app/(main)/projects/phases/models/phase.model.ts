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
    order: number;           // Required for sequencing
    duration: number;        // Total duration
    budget: number;          // Total budget
    description?: string;
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
    // 1. Basic Metadata
    if (!phase.project) {
        return { valid: false, message: 'Project is required.' };
    }

    if (!phase.title) {
        return { valid: false, message: 'Title is required.' };
    }

    if (phase.order === undefined || phase.order < 1) {
        return { valid: false, message: 'A valid phase order (1 or greater) is required.' };
    }

    if (!phase.description || phase.description.trim() === '') {
        return { valid: false, message: 'Phase description is required.' };
    }
    // 4. Final Totals Check (Safety check)
    if (!phase.duration || phase.duration <= 0) {
        return { valid: false, message: 'Total calculated duration must be greater than 0.' };
    }

    return { valid: true };
};


