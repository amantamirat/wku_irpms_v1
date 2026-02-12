import { Accessibility, applicantUnits, Gender } from "../../../applicants/applicant.enum";

export enum ApplicantRangeType {
    AGE = "AGE",
    EXPERIENCE = "EXPERIENCE",
}

export enum ApplicantListType {
    GENDER = "GENDER",
    ACCESSIBILITY = "ACCESSIBILITY",
    SCOPE = "SCOPE",
}

export const ApplicantConstraintValues = [
    ...Object.values(ApplicantRangeType),
    ...Object.values(ApplicantListType),
] as const;

export type ApplicantConstraintType =
    typeof ApplicantConstraintValues[number];

export function isRangeConstraint(type: ApplicantConstraintType): type is ApplicantRangeType {
    return Object.values(ApplicantRangeType).includes(
        type as ApplicantRangeType
    );
}

export function isListConstraint(type: ApplicantConstraintType): type is ApplicantListType {
    return Object.values(ApplicantListType).includes(
        type as ApplicantListType
    );
}

const listOptionsMap: Record<ApplicantListType, any> = {
    [ApplicantListType.GENDER]: Gender,
    [ApplicantListType.ACCESSIBILITY]: Accessibility,
    [ApplicantListType.SCOPE]: applicantUnits,
};

export function getListOptions(type: ApplicantListType) {
    return Object.values(listOptionsMap[type]);
}






