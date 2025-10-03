// ConstraintTypes Enum
export enum ConstraintType {
    PHASE_COUNT = "PHASE-COUNT",          // Logical project phases
    BUDGET_TOTAL = "BUDGET-TOTAL",        // Total project budget
    BUDGET_PHASE = "BUDGET-PHASE",        // Budget per phase
    TIME_TOTAL = "TIME-TOTAL",            // Total project duration
    TIME_PHASE = "TIME-PHASE",            // Time per phase
    PARTICIPANT = "PARTICIPANT",          // Total participants



    PURCHASE_TOTAL = "PURCHASE-TOTAL",    // Total purchases budget
    PURCHASE_PHASE = "PURCHASE-PHASE",    // Purchases per phase

    CO_PI_COUNT = "CO-PI-COUNT",          // Number of Co-PIs
    THEME = "THEME",                      // Number of themes
    SUB_THEME = "SUB-THEME",              // Number of sub-themes
    FOCUS_AREA = "FOCUS-AREA",            // Number of focus areas
    GENDER = "GENDER",                    // Gender constraint
    AGE = "AGE",                          // Age constraint
    ONGOING = "ONGOING",                  // Ongoing projects
    COMPLETED = "COMPLETED",              // Completed projects
    SUBMITTED = "SUBMITTED",              // Submitted projects
    INCOMPLETE = "INCOMPLETE",            // Incomplete projects
    ACADEMIC = "ACADEMIC",                // Academic staff
    STUDENT = "STUDENT",                  // Student participants
    SUPPORTIVE = "SUPPORTIVE",            // Supportive staff/students
    EXTERNAL = "EXTERNAL",                // External applicants
    ACCESSIBILITY = "ACCESSIBILITY",      // Disability constraint
    EXPERIENCE = "EXPERIENCE",            // Experience-based constraint
}

export enum OperationMode {
    OBEY = "OBEY",
    DENY = "DENY",
    FILTER = "FILTER"
}
