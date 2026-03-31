import { Project } from "../../models/project.model";

export enum PhaseStatus {
    proposed = 'proposed',
    reviewed = 'reviewed',
    approved = 'approved',
    active = 'active',
    completed = 'completed',
}

// 1. Define the Breakdown type to match the backend sub-schema
export type PhaseBreakdown = {
    activity: string;
    duration: number;
    budget: number;
};

export type Phase = {
    _id?: string;
    project: string | Project;
    order: number;           // Required for sequencing
    duration: number;        // Total duration
    budget: number;          // Total budget
    description?: string;
    breakdown: PhaseBreakdown[]; // The nested array we added
    status?: PhaseStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetPhaseOptions {
    project?: string | Project;
}

// --- Validation Logic ---

export const validatePhase = (phase: Phase): { valid: boolean; message?: string } => {
    if (!phase.project) {
        return { valid: false, message: 'Project is required.' };
    }
    if (phase.order === undefined || phase.order < 0) {
        return { valid: false, message: 'Phase order is required.' };
    }
    if (!phase.duration || phase.duration <= 0) {
        return { valid: false, message: 'Valid duration is required.' };
    }
    if (!phase.budget || phase.budget <= 0) {
        return { valid: false, message: 'Valid budget is required.' };
    }

    // Validate the breakdown array if it exists
    if (phase.breakdown && phase.breakdown.length > 0) {
        const totalDuration = phase.breakdown.reduce((sum, b) => sum + b.duration, 0);
        const totalBudget = phase.breakdown.reduce((sum, b) => sum + b.budget, 0);

        if (totalDuration !== phase.duration) {
            return { valid: false, message: `Breakdown duration (${totalDuration}) must match total duration (${phase.duration}).` };
        }
        if (totalBudget !== phase.budget) {
            return { valid: false, message: `Breakdown budget (${totalBudget}) must match total budget (${phase.budget}).` };
        }
    }

    return { valid: true };
};

// --- Sanitization Logic ---

export const sanitizePhase = (phase: Partial<Phase>): Phase => {
    return {
        ...phase,
        // Ensure project is just an ID string
        project:
            typeof phase.project === "object" && phase.project !== null
                ? (phase.project as Project)._id
                : phase.project,
        // Ensure breakdown is at least an empty array to avoid undefined errors in UI
        breakdown: phase.breakdown || []
    } as Phase;
};