import { Constraint } from "../../models/constraint.model";

export type Range = {
    min: number;
    max: number;
};

export type Composition = {
    _id?: string;
    constraint: string | Constraint;

    min: number;  // required (composition min)
    max: number;  // required (composition max)

    item?: string;
    range?: Range;

    createdAt?: Date;
    updatedAt?: Date;
};

export const validateComposition = (
    composition: Composition
): { valid: boolean; message?: string } => {

    if (!composition.constraint) {
        return { valid: false, message: "Applicant constraint is required." };
    }

    if (composition.min == null || isNaN(composition.min)) {
        return { valid: false, message: "Minimum is required." };
    }

    if (composition.max == null || isNaN(composition.max)) {
        return { valid: false, message: "Maximum is required." };
    }

    if (composition.min > composition.max) {
        return { valid: false, message: "Minimum cannot be greater than maximum." };
    }

    if (composition.range) {
        if (
            composition.range.min == null ||
            composition.range.max == null
        ) {
            return { valid: false, message: "Range min and max are required." };
        }

        if (composition.range.min > composition.range.max) {
            return { valid: false, message: "Range min cannot be greater than range max." };
        }
    }

    return { valid: true };
};
