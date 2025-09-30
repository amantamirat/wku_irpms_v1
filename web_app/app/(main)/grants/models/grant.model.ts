import { Theme } from "../../themes/models/theme.model";
import { Evaluation } from "../../evals/models/eval.model";
import { Organization } from "../../organizations/models/organization.model";

export type Grant = {
    _id?: string;
    directorate: string | Organization;
    title: string;
    description?: string;
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
    return { valid: true };
};