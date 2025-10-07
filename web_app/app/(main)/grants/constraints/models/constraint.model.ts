import { Grant } from "../../models/grant.model";

export enum BaseConstraintType {
    PROJECT = "Project",
    APPLICANTS = "Applicant",
}

export enum ProjectConstraintType {
    PARTICIPANT = "PARTICIPANT",          // Total participants
    PHASE_COUNT = "PHASE-COUNT",          // Logical project phases
    BUDGET_TOTAL = "BUDGET-TOTAL",        // Total project budget
    TIME_TOTAL = "TIME-TOTAL",            // Total project duration
    BUDGET_PHASE = "BUDGET-PHASE",        // Budget per phase    
    TIME_PHASE = "TIME-PHASE",            // Time per phase    
    PURCHASE_TOTAL = "PURCHASE-TOTAL",    // Total purchases budget
    PURCHASE_PHASE = "PURCHASE-PHASE",    // Purchases per phase
    THEME = "THEME",                      // Number of themes
    COMPONENT = "COMPONENT",              // Number of sub-themes
    FOCUS_AREA = "FOCUS-AREA",
}

export enum OperationMode {
    OBEY = "OBEY",
    DENY = "DENY",
    //FILTER = "FILTER"
}

export type Constraint = {
    _id?: string;
    grant?: string | Grant; //
    type: BaseConstraintType;
    constraint?: ProjectConstraintType;
    max?: number;
    min?: number;
    parent?: string | Constraint; //
    mode?: OperationMode; //
    valueType?: string;
    value?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateConstraint = (constraint: Constraint): { valid: boolean; message?: string } => {
    return { valid: true };
}