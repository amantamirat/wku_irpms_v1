import { Grant } from "../../models/grant.model";

export enum ConstraintType {
    PROJECT = "Project",
    APPLICANT = "Applicant"
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
const listApplicantConstraints = [ApplicantConstraintType.GENDER, ApplicantConstraintType.ACCESSIBILITY, ApplicantConstraintType.SCOPE];

export function isRangeConstraint(type: ApplicantConstraintType) {
    return rangeApplicantConstraints.includes(type);
}
export function isListConstraint(type: ApplicantConstraintType) {
    return listApplicantConstraints.includes(type);
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
        return { valid: false, message: 'Grant is required.' };
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