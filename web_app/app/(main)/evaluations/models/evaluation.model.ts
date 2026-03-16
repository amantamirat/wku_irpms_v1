import { Organization } from "../../organizations/models/organization.model";

export type Evaluation = {
    _id?: string;
    organization: string | Organization;
    title: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetEvaluationsOptions {
    organization?: string | Organization;
    populate?: boolean;
}

export const validateEvaluation = (
    evaluation: Evaluation
): { valid: boolean; message?: string } => {
    if (!evaluation.title || evaluation.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (!evaluation.organization) {
        return { valid: false, message: "Organization is required." };
    }
    return { valid: true };
};


export function sanitize(evaluation: Partial<Evaluation>): Partial<Evaluation> {
    return {
        ...evaluation,
        organization:
            typeof evaluation.organization === 'object' && evaluation.organization !== null
                ? (evaluation.organization as Organization)._id
                : evaluation.organization
    };
}

export const createEmptyEval = (): Evaluation => ({
    organization: "",
    title: "",
})