import { Evaluation } from "../../evaluations/models/evaluation.model";

export enum FormType {
    OPEN = 'Open',             // Textarea (No score)
    SINGLE_CHOICE = 'Single',  // Radio buttons (One score)
    MULTIPLE_CHOICE = 'Multi', // Checkboxes (Cumulative score)
    NUMBER = 'Number'          // Numeric input (Raw score)
}

// Updated to include all the types we discussed
export const formTypeOptions = [
    { label: 'Open Ended (No Score)', value: FormType.OPEN },
    { label: 'Single Choice', value: FormType.SINGLE_CHOICE },
    { label: 'Multiple Choice', value: FormType.MULTIPLE_CHOICE },
    { label: 'Numeric Metric', value: FormType.NUMBER },
];

export type CriterionOption = {
    _id?: string;
    title: string;
    score: number;
};

export type Criterion = {
    _id?: string;
    evaluation: string | Evaluation;
    title: string;
    weight: number;
    formType: FormType;
    options: CriterionOption[]; // ✅ Added embedded options
    order?: number;             // ✅ Added for UI sequencing
    isRequired?: boolean;       // ✅ Added for form validation
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetCriteriaOptions {
    evaluation?: string | Evaluation;
    populate?: boolean;
}

/**
 * Enhanced validation to check for options if the type is Choice-based
 */
export const validateCriterion = (
    criterion: Criterion
): { valid: boolean; message?: string } => {
    if (!criterion.title || criterion.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (criterion.weight === undefined || criterion.weight < 0) {
        return { valid: false, message: "Weight must be 0 or greater." };
    }
    if (!criterion.formType) {
        return { valid: false, message: "Form type is required." };
    }

    // Logic for Choice-based types
    if ([FormType.SINGLE_CHOICE, FormType.MULTIPLE_CHOICE].includes(criterion.formType)) {
        if (!criterion.options || criterion.options.length < 2) {
            return { valid: false, message: "Choice-based criteria must have at least two options." };
        }

        // Ensure no option exceeds the total weight of the criterion
        const invalidOption = criterion.options.find(opt => opt.score > criterion.weight);
        if (invalidOption) {
            return { valid: false, message: `Option "${invalidOption.title}" score cannot exceed total weight.` };
        }
    }

    return { valid: true };
};

/**
 * Sanitizes the object for API consumption
 */
export function sanitize(criterion: Partial<Criterion>): Partial<Criterion> {
    return {
        ...criterion,
        evaluation:
            typeof criterion.evaluation === 'object' && criterion.evaluation !== null
                ? (criterion.evaluation as Evaluation)._id
                : criterion.evaluation,
        // Ensure options is always an array even if undefined
        options: criterion.options || []
    };
}

export const createEmptyCriterion = (criterion?: Partial<Criterion>): Criterion => ({
    evaluation: criterion?.evaluation ?? "",
    title: criterion?.title ?? "",
    weight: criterion?.weight ?? 0,
    formType: criterion?.formType ?? FormType.SINGLE_CHOICE,
    options: criterion?.options ?? [], // ✅ Initialize as empty array
    order: criterion?.order ?? 0,
    isRequired: criterion?.isRequired ?? true,
});