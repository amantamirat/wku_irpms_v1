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
    //PURCHASE_TOTAL = "PURCHASE-TOTAL",    // Total purchases budget
    //PURCHASE_PHASE = "PURCHASE-PHASE",    // Purchases per phase
    //THEME = "THEME",                      // Number of themes
    //COMPONENT = "COMPONENT",              // Number of sub-themes
    //FOCUS_AREA = "FOCUS-AREA",
}

export enum ApplicantConstraintType {
    GENDER = "GENDER",                    // Gender constraint   (female, male) 
    ACCESSIBILITY = "ACCESSIBILITY",      // Disability constraint  (visual, hearing, mobility, cognitive)
    SCOPE = "SCOPE",                      // Scope constraint (academic, supportive, external)  
    AGE = "AGE",                          // Age constraint (min age, max age)
    EXPERIENCE = "EXPERIENCE",            // Experience-based constraint  
}

const rangeApplicantConstraints = [ApplicantConstraintType.AGE, ApplicantConstraintType.EXPERIENCE];
const enumApplicantConstraints = [ApplicantConstraintType.GENDER, ApplicantConstraintType.ACCESSIBILITY, ApplicantConstraintType.SCOPE];

export function isRangeConstraint(type: ApplicantConstraintType) {
    return rangeApplicantConstraints.includes(type);
}
export function isEnumConstraint(type: ApplicantConstraintType) {
    return enumApplicantConstraints.includes(type);
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
    constraint?: ProjectConstraintType | ApplicantConstraintType;
    max?: number;
    min?: number;    
    values?: string[];
    range?: { min: number; max: number };
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateConstraint = (constraint: Constraint): { valid: boolean; message?: string } => {
    return { valid: true };
}