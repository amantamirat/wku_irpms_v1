import { Organization } from "@/app/(main)/organizations/models/organization.model";
import { Constraint } from "../../models/constraint.model";
import { Specialization } from "@/app/(main)/specializations/models/specialization.model";

export type Range = {
    min: number;
    max: number;
};


export type Composition = {
    _id?: string;

    constraint: string | Constraint;

    min: number;
    max: number;

    // ✅ For ENUM constraints
    enumValue?: string;

    // ✅ For DYNAMIC constraints
    item?: string | any; // ObjectId as string
    // itemModel?: "Organization" | "Specialization";

    // ✅ For RANGE constraints
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
