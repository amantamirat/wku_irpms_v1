import { Evaluation } from "../../evaluations/models/evaluation.model";

export enum FormType {
    OPEN = 'Open',             // Textarea (No score)
    SINGLE_CHOICE = 'Single',  // Radio buttons (One score)
    MULTIPLE_CHOICE = 'Multi', // Checkboxes (Cumulative score)
    NUMBER = 'Number'          // Numeric input (Raw score)
}

export const formTypeOptions = [
    { label: 'Open Ended (No Score)', value: FormType.OPEN },
    { label: 'Single Choice', value: FormType.SINGLE_CHOICE },
    { label: 'Multiple Choice', value: FormType.MULTIPLE_CHOICE },
    { label: 'Numeric Metric', value: FormType.NUMBER },
];

export type CriterionOption = {
    _id: string;
    title: string;
    score: number;
};

export type Criterion = {
    _id?: string;
    evaluation: string | Evaluation;
    title?: string;
    weight?: number;
    formType?: FormType;
    options?: CriterionOption[];
    order?: number;             
    isRequired?: boolean;       
    createdAt?: Date;
    updatedAt?: Date;
};

export interface FilterCriteriaOptions {
    evaluation?: string | Evaluation;
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
    
    // Explicitly check for undefined and negative values (allows 0 for Open form types)
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

        // Use `?? 0` to safely handle TypeScript's undefined check for `weight`
        const maxWeight = criterion.weight ?? 0;
        const invalidOption = criterion.options.find(opt => opt.score > maxWeight);
        if (invalidOption) {
            return { valid: false, message: `Option "${invalidOption.title}" score cannot exceed total weight.` };
        }
    }

    return { valid: true };
};
/*
export const createEmptyCriterion = (criterion?: Partial<Criterion>): Criterion => ({
    evaluation: criterion?.evaluation ?? "",
    title: criterion?.title ?? "",
    weight: criterion?.weight ?? 0,
    formType: criterion?.formType ?? FormType.NUMBER,
    options: criterion?.options ?? [],
    order: criterion?.order ?? 0,
    isRequired: criterion?.isRequired ?? true,
});*/