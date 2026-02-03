import { Organization } from "../../organizations/models/organization.model";

export enum FundingSource {
    INTERNAL = "internal",
    EXTERNAL = "external",
}

export type Grant = {
    _id?: string;
    fundingSource?: FundingSource;
    organization?: string | Organization;
    title?: string;
    description?: string;
    amount: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateGrant = (grant: Grant): { valid: boolean; message?: string } => {
    if (!grant.title || grant.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    if (!grant.organization) {
        return { valid: false, message: 'Directorate is required.' };
    }
    return { valid: true };
};

export function sanitizeGrant(grant: Partial<Grant>): Partial<Grant> {
    return {
        ...grant,
        organization:
            typeof grant.organization === 'object' && grant.organization !== null
                ? (grant.organization as Organization)._id
                : grant.organization
    };
}

export interface GetGrantsOptions {
    organization?: string | Organization;
}