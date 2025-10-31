//import { Evaluation } from "@/app/(main)/evals/models/evaluation.model";
import { Reviewer } from "../../reviewers/models/reviewer.model";
import { Criterion } from "@/app/(main)/evaluations/models/criterion.model";
import { Option } from "@/app/(main)/evaluations/models/option.model";


export type Result = {
    _id?: string;
    evaluator: string | Reviewer;
    criterion: string | Criterion;
    score?: number;
    selected_option?: string | Option;
    createdAt?: Date;
    updatedAt?: Date;
};

export const resultTemplate = (result: Result) => {
    if (!result) return null;
    throw new Error("resultTemplate not implemented yet.");
};

export const validateResult = (result: Result): { valid: boolean; message?: string } => {
    if (!result.evaluator) {
        return { valid: false, message: "Evaluator is required." };
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
        evaluator:
            typeof result.evaluator === "object" && result.evaluator !== null
                ? (result.evaluator as any)._id
                : result.evaluator,
        selected_option:
            typeof result.selected_option === "object" && result.selected_option !== null
                ? (result.selected_option as any)._id
                : result.selected_option,
    } as Result;
};
