import { Directorate } from "../directorate";

export enum EvaluationStatus {
    Active = 'Active',
    Locked = 'Locked'
}

export type Evaluation = {
    _id?: string;
    directorate: string | Directorate;
    title: string;
    status: EvaluationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateEvaluation = (evaluation: Evaluation): { valid: boolean; message?: string } => {
    
    if (!evaluation.directorate) {
        return { valid: false, message: 'Directorate is required.' };
    }

    if (!evaluation.title || evaluation.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }

    if (!evaluation.status) {
        return { valid: false, message: 'Status is required.' };
    }

    return { valid: true };
};
