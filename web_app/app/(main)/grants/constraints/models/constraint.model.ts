import { Grant } from "../../models/grant.model";

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
export enum ProjectConstraintType {
    PROJECT_TITLE = "PROJECT_TITLE",
    PROJECT_SUMMARY = "PROJECT_SUMMARY",
    PARTICIPANT = "PARTICIPANT",// Total participants
    PHASE_COUNT = "PHASE-COUNT",// Logical project phases
    BUDGET_TOTAL = "BUDGET-TOTAL",// Total project budget
    TIME_TOTAL = "TIME-TOTAL",// Total project duration
    BUDGET_PHASE = "BUDGET-PHASE",// Budget per phase    
    TIME_PHASE = "TIME-PHASE",// Time per phase    
    ACTIVITIES_PHASE = "ACTIVITIES-PHASE",//activities per phase
    THEME = "THEME",
    SUB_THEME = "SUB_THEME",
    FOCUS_AREA = "FOCUS_AREA",
    INDICATOR = "INDICATOR"
}
