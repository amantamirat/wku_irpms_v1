import { Project } from "../../models/project.model";

export enum PhaseStatus {
    proposed = 'proposed',
    reviewed = 'reviewed',
    approved = 'approved',
    active = 'active',
    completed = 'completed',
}

/*
// 1. Define the Breakdown type to match the backend sub-schema
export type PhaseBreakdown = {
    activity: string;
    duration: number;
    budget: number;
};
*/

export type Phase = {
    _id?: string;
    project?: string | Project;
    title: string;
    order: number;           // Required for sequencing
    duration: number;        // Total duration
    budget: number;          // Total budget
    description?: string;
    //breakdown: PhaseBreakdown[]; // The nested array we added
    status?: PhaseStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetPhaseOptions {
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

    /*
    // 2. Breakdown Requirements
    // Since Simple Mode is removed, we require at least one activity
    if (!phase.breakdown || phase.breakdown.length === 0) {
        return { valid: false, message: 'At least one activity is required in the breakdown.' };
    }

    // 3. Individual Activity Validation
    for (const [index, item] of phase.breakdown.entries()) {
        const activityNum = index + 1;

        if (!item.activity || item.activity.trim() === '') {
            return { valid: false, message: `Activity #${activityNum} is missing a description.` };
        }

        if (item.duration === undefined || item.duration <= 0) {
            return { valid: false, message: `Activity #${activityNum} must have a duration greater than 0.` };
        }

        if (item.budget === undefined || item.budget < 0) {
            return { valid: false, message: `Activity #${activityNum} cannot have a negative budget.` };
        }
    }
*/
    // 4. Final Totals Check (Safety check)
    if (!phase.duration || phase.duration <= 0) {
        return { valid: false, message: 'Total calculated duration must be greater than 0.' };
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
        //breakdown: phase.breakdown || []
    } as Phase;
};