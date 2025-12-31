import { Reviewer } from "../../reviewers/models/reviewer.model";
import { Criterion } from "@/app/(main)/evaluations/models/criterion.model";
import { Option } from "@/app/(main)/evaluations/models/option.model";

export type Result = {
    _id?: string;
    criterion: string | Criterion;
    reviewer: string | Reviewer;
    score?: number;
    selectedOption?: string | Option;
    comment?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetResultOptions {
    reviewer: Reviewer | string;
}


export const validateResult = (result: Result): { valid: boolean; message?: string } => {
    if (!result.reviewer) {
        return { valid: false, message: "Reviewer is required." };
    }
    if (!result.criterion) {
        return { valid: false, message: "Criterion is required." };
    }
    if (result.score == null || result.score < 0) {
        return { valid: false, message: "Score is required and must be >= 0." };
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
        selectedOption:
            typeof result.selectedOption === "object" && result.selectedOption !== null
                ? (result.selectedOption as any)._id
                : result.selectedOption,
    } as Result;
};
