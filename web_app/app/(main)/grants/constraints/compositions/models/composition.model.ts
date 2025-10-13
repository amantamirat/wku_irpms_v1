import { Constraint } from "../../models/constraint.model";

export type Composition = {
    _id?: string;
    parent: string | Constraint; // Reference to parent constraint
    value: number; // Required number or ratio of applicants
    max?: number; // value for range-based constraints
    min?: number; // value for range-based constraints
    item?: string; // Allowed values for enum-based constraints
    createdAt?: Date;
    updatedAt?: Date;
};

export const validateComposition = (composition: Composition): { valid: boolean; message?: string } => {
    if (!composition.parent) {
        return { valid: false, message: 'Parent constraint is required.' };
    }
    if (composition.value == null || isNaN(composition.value)) {
        return { valid: false, message: 'Value is required.' };
    }
    if (composition.min != null && isNaN(composition.min)) {
        return { valid: false, message: 'Minimum value must be a number.' };
    }
    if (composition.max != null && isNaN(composition.max)) {
        return { valid: false, message: 'Maximum value must be a number.' };
    }
    if (composition.min != null && composition.max != null) {
        if (composition.min > composition.max) {
            return { valid: false, message: 'Minimum value cannot be greater than maximum value.' };
        }
    }
    return { valid: true };
};
