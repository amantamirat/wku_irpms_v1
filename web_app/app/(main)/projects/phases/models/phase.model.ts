import { Project } from "../../models/project.model";

export enum PhaseType {
    phase = 'phase',
    breakdown = 'breakdown'
}

export type Phase = {
    _id?: string;
    type: PhaseType;
    project?: string | Project;
    activity: string;
    order: number;
    duration: number;
    budget: number;
    description?: string;
    parent?: string | Phase;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validatePhase = (pt: Phase): { valid: boolean; message?: string } => {
    if (!pt.type) {
        return { valid: false, message: 'Type is required.' };
    }
    if (!pt.project) {
        return { valid: false, message: 'Project is required.' };
    }
    if (!pt.activity || pt.activity.trim().length === 0) {
        return { valid: false, message: 'Activity is required.' };
    }
    if (!pt.order) {
        return { valid: false, message: 'Order is required.' };
    }
    if (!pt.duration) {
        return { valid: false, message: 'Duration is required.' };
    }
    if (!pt.budget) {
        return { valid: false, message: 'Budget is required.' };
    }
    if (pt.type === PhaseType.breakdown) {
        if (!pt.parent) {
            return { valid: false, message: 'Breakdownn Phase is required.' };
        }
    }
    return { valid: true };
};