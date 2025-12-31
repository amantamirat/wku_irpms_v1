import { Evaluation } from "../../evaluations/models/evaluation.model";

export enum FormType {
    open = "Open",
    closed = "Closed",
}

export type Criterion = {
    _id?: string;
    evaluation: string | Evaluation;
    title: string;
    weight: number;
    formType: FormType;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetCriteriaOptions {
    evaluation?: string | Evaluation;
    //stage?: string;
    //reviewer?: string;
}

export const validateCriterion = (
    criterion: Criterion): { valid: boolean; message?: string } => {
    if (!criterion.title || criterion.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (criterion.weight === undefined || criterion.weight <= 0) {
        return { valid: false, message: "Weight must be greater than zero." };
    }
    if (!criterion.formType) {
        return { valid: false, message: "Form type is required." };
    }
    return { valid: true };
};

export function sanitizeCriterion(criterion: Partial<Criterion>): Partial<Criterion> {
    return {
        ...criterion,
        evaluation:
            typeof criterion.evaluation === 'object' && criterion.evaluation !== null
                ? (criterion.evaluation as Evaluation)._id
                : criterion.evaluation
    };
}
