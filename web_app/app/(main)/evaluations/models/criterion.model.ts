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
    form_type: FormType;
    createdAt?: Date;
    updatedAt?: Date;
};

export const validateCriterion = (
    criterion: Criterion): { valid: boolean; message?: string } => {
    if (!criterion.title || criterion.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (criterion.weight === undefined || criterion.weight <= 0) {
        return { valid: false, message: "Weight must be greater than zero." };
    }
    if (!criterion.form_type) {
        return { valid: false, message: "Form type is required." };
    }
    return { valid: true };
};
