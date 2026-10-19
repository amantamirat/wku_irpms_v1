
export enum EvaluationStatus {

    draft = 'draft',

    published = 'published',

    archived = 'archived'

}

export type Evaluation = {
    _id?: string;
    title: string;
    description?: string;
    weight: number;
    status?: EvaluationStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface FilterEvaluationsOptions {
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

