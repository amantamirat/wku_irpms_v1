import { Criterion, CriterionOption, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import { Reviewer } from "../../models/reviewer.model";

export type Result = {
    _id?: string;
    criterion: string | Criterion;
    reviewer: string | Reviewer;

    score?: number;

    // ✅ updated
    selectedOptions?: (string | CriterionOption)[];

    comment?: string;
};

export interface GetResultsOptions {
    reviewer: Reviewer | string;
    populate?: boolean;
}


export const validateResult = (
    result: Result,
    criterion?: Criterion
): { valid: boolean; message?: string } => {

    if (!result.reviewer) {
        return { valid: false, message: "Reviewer is required." };
    }

    if (!result.criterion) {
        return { valid: false, message: "Criterion is required." };
    }

    if (!criterion) {
        return { valid: true }; // fallback if not provided
    }

    switch (criterion.formType) {

        case FormType.OPEN:
            if (criterion.isRequired && !result.comment) {
                return { valid: false, message: "Comment is required." };
            }
            break;

        case FormType.NUMBER:
            if (result.score == null || result.score < 0) {
                return { valid: false, message: "Valid score is required." };
            }
            break;

        case FormType.SINGLE_CHOICE:
            if (!result.selectedOptions || result.selectedOptions.length !== 1) {
                return { valid: false, message: "Select exactly one option." };
            }
            break;

        case FormType.MULTIPLE_CHOICE:
            if (!result.selectedOptions || result.selectedOptions.length === 0) {
                return { valid: false, message: "Select at least one option." };
            }
            break;
    }

    return { valid: true };
};


export const sanitizeResult = (result: Partial<Result>): Result => {
    return {
        ...result,

        criterion:
            typeof result.criterion === "object" && result.criterion !== null
                ? (result.criterion as any)._id
                : result.criterion,

        reviewer:
            typeof result.reviewer === "object" && result.reviewer !== null
                ? (result.reviewer as any)._id
                : result.reviewer,

        // ✅ FIXED: array handling
        selectedOptions:
            result.selectedOptions?.map((opt) =>
                typeof opt === "object" && opt !== null
                    ? (opt as any)._id
                    : opt
            ) || [],
    } as Result;
};