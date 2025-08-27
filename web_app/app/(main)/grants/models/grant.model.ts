import { Theme } from "../../themes/models/theme.model";
import { Evaluation } from "../../evals/models/eval.model";
import { Organization } from "../../organizations/models/organization.model";

export type Grant = {
    _id?: string;
    directorate: string | Organization;
    title: string;
    description?: string;
    theme: string | Theme;
    evaluation: string | Evaluation;
    createdAt?: Date;
    updatedAt?: Date;
}


export const validateGrant = (grant: Grant): { valid: boolean; message?: string } => {
    if (!grant.title || grant.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    if (!grant.directorate) {
        return { valid: false, message: 'Directorate is required.' };
    }

    if (!grant.theme) {
        return { valid: false, message: 'Theme is required.' };
    }

    if (!grant.evaluation) {
        return { valid: false, message: 'Evaluation is required.' };
    }
    return { valid: true };
};