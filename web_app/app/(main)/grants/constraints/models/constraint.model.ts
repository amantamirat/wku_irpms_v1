import { Grant } from "../../models/grant.model";

export enum BaseConstraintType {
    PROJECT = "Project",
    APPLICANTS = "Applicant",
}

export enum ProjectConstraintType {
    PHASE_COUNT = "PHASE-COUNT",          // Logical project phases
    BUDGET_TOTAL = "BUDGET-TOTAL",        // Total project budget
    BUDGET_PHASE = "BUDGET-PHASE",        // Budget per phase
    TIME_TOTAL = "TIME-TOTAL",            // Total project duration
    TIME_PHASE = "TIME-PHASE",            // Time per phase
    PARTICIPANT = "PARTICIPANT",          // Total participants
    PURCHASE_TOTAL = "PURCHASE-TOTAL",    // Total purchases budget
    PURCHASE_PHASE = "PURCHASE-PHASE",    // Purchases per phase
    THEME = "THEME",                      // Number of themes
    COMPONENT = "COMPONENT",              // Number of sub-themes
    FOCUS_AREA = "FOCUS-AREA",            // Number of focus areas
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
    constarint?: ProjectConstraintType;
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