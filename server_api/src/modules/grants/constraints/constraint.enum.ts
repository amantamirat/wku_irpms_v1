
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
    //FOCUS_AREA = "FOCUS-AREA",            // Number of focus areas
}

export enum ConstraintType {
    
    //////////////////////////////////////////////////////////
    GENDER = "GENDER",                    // Gender constraint
    ACCESSIBILITY = "ACCESSIBILITY",      // Disability constraint
    AGE = "AGE",                          // Age constraint    
    EXPERIENCE = "EXPERIENCE",            // Experience-based constraint

    SUBMITTED = "SUBMITTED",              // Submitted projects
    ONGOING = "ONGOING",                  // Ongoing projects
    COMPLETED = "COMPLETED",              // Completed projects
    INCOMPLETE = "INCOMPLETE",            // Incomplete projects

    ACADEMIC = "ACADEMIC",                // Academic staff
    STUDENT = "STUDENT",                  // Student participants
    SUPPORTIVE = "SUPPORTIVE",            // Supportive staff/students
    EXTERNAL = "EXTERNAL",                // External applicants    
    //CO_PI_COUNT = "CO-PI-COUNT",          // Number of Co-PIs
}

export enum OperationMode {
    OBEY = "OBEY",
    DENY = "DENY",
    FILTER = "FILTER"
}
