import { Evaluation } from "@/app/(main)/evals/models/eval.model";
import { Reviewer } from "../../reviewers/models/reviewer.model";


export type Result = {
    _id?: string;
    evaluator: string | Reviewer;
    criterion: string | Evaluation;
    score: number;
    comment?: string;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
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
                ? (result.criterion as Evaluation)._id
                : result.criterion,
        evaluator:
            typeof result.evaluator === "object" && result.evaluator !== null
                ? (result.evaluator as any)._id
                : result.evaluator,
    } as Result;
};
