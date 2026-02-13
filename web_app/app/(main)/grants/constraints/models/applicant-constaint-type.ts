import { Accessibility, applicantUnits, Gender } from "@/app/(main)/applicants/models/applicant.model";

export enum ApplicantRangeType {
    AGE = "AGE",
    EXPERIENCE = "EXPERIENCE",
}

export enum ApplicantListType {
    GENDER = "GENDER",
    ACCESSIBILITY = "ACCESSIBILITY",
    SCOPE = "SCOPE",
}

export enum ApplicantDynamicType {
    WORKSPACE = "WORKSPACE",
    SPECIALIZATION = "SPECIALIZATION"
}

export const ApplicantConstraintValues = [
    ...Object.values(ApplicantRangeType),
    ...Object.values(ApplicantListType),
    ...Object.values(ApplicantDynamicType),
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

export function isDynamicConstraint(type: ApplicantConstraintType): type is ApplicantDynamicType {
    return Object.values(ApplicantDynamicType).includes(
        type as ApplicantDynamicType
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









