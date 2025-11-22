import { Accessibility, applicantUnits, Gender } from "@/app/(main)/applicants/models/applicant.model";


export enum ApplicantConstraintType {
    GENDER = "GENDER",                    // Gender constraint   (female, male) 
    ACCESSIBILITY = "ACCESSIBILITY",      // Disability constraint  (visual, hearing, mobility, cognitive)
    SCOPE = "SCOPE",                      // Scope constraint (academic, supportive, external)  
    AGE = "AGE",                          // Age constraint (min age, max age)
    EXPERIENCE = "EXPERIENCE",            // Experience-based constraint  
}

const constraintKindMap: Record<ApplicantConstraintType, "range" | "list"> = {
    [ApplicantConstraintType.AGE]: "range",
    [ApplicantConstraintType.EXPERIENCE]: "range",
    [ApplicantConstraintType.GENDER]: "list",
    [ApplicantConstraintType.ACCESSIBILITY]: "list",
    [ApplicantConstraintType.SCOPE]: "list",
};

export function isRangeConstraint(type: ApplicantConstraintType) {
    return constraintKindMap[type] === "range";
}
export function isListConstraint(type: ApplicantConstraintType) {
    return constraintKindMap[type] === "list";
}

const listOptionsMap: Partial<Record<ApplicantConstraintType, any>> = {
    [ApplicantConstraintType.GENDER]: Gender,
    [ApplicantConstraintType.ACCESSIBILITY]: Accessibility,
    [ApplicantConstraintType.SCOPE]: applicantUnits,
};

export function getListOptions(type: ApplicantConstraintType): never[] | null {
    if (!isListConstraint(type)) return null;
    return Object.values(listOptionsMap[type]); // returns array of options
}


