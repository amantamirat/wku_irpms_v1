import { Organization } from "../../organizations/models/organization.model";

export type Evaluation = {
    _id?: string;
    directorate: string | Organization;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetEvaluationsOptions {
    directorate?: string | Organization;
}

export const validateEvaluation = (
    evaluation: Evaluation
): { valid: boolean; message?: string } => {
    if (!evaluation.title || evaluation.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (!evaluation.directorate) {
        return { valid: false, message: "Directorate is required." };
    }
    return { valid: true };
};


export function sanitizeEvaluation(evaluation: Partial<Evaluation>): Partial<Evaluation> {
    return {
        ...evaluation,
        directorate:
            typeof evaluation.directorate === 'object' && evaluation.directorate !== null
                ? (evaluation.directorate as Organization)._id
                : evaluation.directorate
    };
}