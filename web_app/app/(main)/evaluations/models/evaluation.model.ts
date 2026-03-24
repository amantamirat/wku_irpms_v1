import { EvaluationStatus } from "./evaluation.state-machine";

export type Evaluation = {
    _id?: string;
    title: string;
    description?: string;
    weight: number;
    status?: EvaluationStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetEvaluationsOptions {
    status?: EvaluationStatus;
}

export const validateEvaluation = (
    evaluation: Evaluation
): { valid: boolean; message?: string } => {
    if (!evaluation.title || evaluation.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    return { valid: true };
};


export function sanitize(evaluation: Partial<Evaluation>): Partial<Evaluation> {
    return {
        ...evaluation,
        /*
        organization:
            typeof evaluation.organization === 'object' && evaluation.organization !== null
                ? (evaluation.organization as Organization)._id
                : evaluation.organization*/
    };
}

export const createEmptyEval = (): Evaluation => ({
    title: "",
    weight:100
})