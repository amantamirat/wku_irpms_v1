
export enum BaseConstraintType {
    PROJECT = "Project",
    APPLICANT = "Applicant",
    COMPOSITION = "Composition"
}

export enum ProjectConstraintType {
    PARTICIPANT = "PARTICIPANT",          // Total participants
    PHASE_COUNT = "PHASE-COUNT",          // Logical project phases
    BUDGET_TOTAL = "BUDGET-TOTAL",        // Total project budget
    TIME_TOTAL = "TIME-TOTAL",            // Total project duration
    BUDGET_PHASE = "BUDGET-PHASE",        // Budget per phase    
    TIME_PHASE = "TIME-PHASE",            // Time per phase    
    //PURCHASE_TOTAL = "PURCHASE-TOTAL",   // Total purchases budget
    //PURCHASE_PHASE = "PURCHASE-PHASE",    // Purchases per phase
    //THEME = "THEME",                      // Number of themes
    //COMPONENT = "COMPONENT",              // Number of sub-themes
    //FOCUS_AREA = "FOCUS-AREA",            // Number of focus areas
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

//////////////////////////////////////////////////////////
export enum ConstraintType {
    // Project Status Constraints
    SUBMITTED = "SUBMITTED",              // Submitted projects
    ONGOING = "ONGOING",                  // Ongoing projects
    COMPLETED = "COMPLETED",              // Completed projects
    INCOMPLETE = "INCOMPLETE",            // Incomplete projects
    // Participant Type Constraints
    ACADEMIC = "ACADEMIC",                // Academic staff
    STUDENT = "STUDENT",                  // Student participants
    SUPPORTIVE = "SUPPORTIVE",            // Supportive staff/students
    EXTERNAL = "EXTERNAL",                // External applicants    
    //CO_PI_COUNT = "CO-PI-COUNT",          // Number of Co-PIs
}


