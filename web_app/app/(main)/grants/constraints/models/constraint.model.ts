import { Grant } from "../../models/grant.model";
import { ApplicantConstraintType } from "./applicant-constaint-type";
import { ProjectConstraintType } from "./project-constraint-type";

export enum ConstraintType {
    PROJECT = "project",
    APPLICANT = "applicant"
}

export enum OperationMode {
    COUNT = "COUNT",
    RATIO = "RATIO"
}

export type Constraint = {
    _id?: string;
    grant?: string | Grant; //
    type: ConstraintType;
    constraint?: ProjectConstraintType | ApplicantConstraintType;
    max?: number;
    min?: number;
    mode?: OperationMode;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateConstraint = (constraint: Constraint): { valid: boolean; message?: string } => {
    if (!constraint.type) {
        return { valid: false, message: 'Type is required.' };
    }
    if (!constraint.grant) {
        return { valid: false, message: 'Grant is required.' };
    }
    if (constraint.type === ConstraintType.APPLICANT) {
        if (!constraint.mode) {
            return { valid: false, message: 'Operation mode is required for applicant constraints.' };
        }
    }
    if (constraint.type === ConstraintType.PROJECT) {
        if (constraint.min == null || isNaN(constraint.min)) {
            return { valid: false, message: 'Minimum value is required.' };
        }
        if (constraint.max == null || isNaN(constraint.max)) {
            return { valid: false, message: 'Maximum value is required.' };
        }
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
    type?: ConstraintType;
}