import { Grant } from "../../models/grant.model";
import { ProjectConstraintType } from "./project-constraint-type";

export type Constraint = {
    _id?: string;
    grant?: string | Grant;
    constraint?: ProjectConstraintType;
    max?: number;
    min?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateConstraint = (constraint: Constraint): { valid: boolean; message?: string } => {

    if (!constraint.grant) {
        return { valid: false, message: 'Grant is required.' };
    }

    if (constraint.min == null || isNaN(constraint.min)) {
        return { valid: false, message: 'Minimum value is required.' };
    }
    if (constraint.max == null || isNaN(constraint.max)) {
        return { valid: false, message: 'Maximum value is required.' };
    }

    return { valid: true };
}


export function sanitizeConstraint(constraint: Partial<Constraint>): Partial<Constraint> {
    return {
        ...constraint,
        grant:
            typeof constraint.grant === 'object' && constraint.grant !== null
                ? (constraint.grant as Grant)._id
                : constraint.grant
    };
}

export interface GetConstraintsOptions {
    grant?: string | Grant;
}