import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { Organization } from "@/app/(main)/organizations/models/organization.model";
import { Position } from "../../positions/models/position.model";

export enum EmploymentType {
    FullTime = "Full-Time",
    PartTime = "Part-Time",
    Contract = "Contract",
    Internship = "Internship",
    Volunteer = "Volunteer",
}

export type Experience = {
    _id?: string;

    applicant?: string | Applicant;
    organization?: string | Organization;
    rank?: string | Position;

    jobTitle?: string;
    startDate?: Date;
    endDate?: Date | null;
    isCurrent?: boolean;

    employmentType?: EmploymentType;

    createdAt?: Date;
    updatedAt?: Date;
};


export const validateExperience = (
    exp: Experience
): { valid: boolean; message?: string } => {

    if (!exp.applicant) {
        return { valid: false, message: "Applicant is required." };
    }
    if (!exp.organization) {
        return { valid: false, message: "Organization is required." };
    }
    if (!exp.rank) {
        return { valid: false, message: "Rank is required." };
    }
    if (!exp.startDate) {
        return { valid: false, message: "Start date is required." };
    }
    if (!exp.employmentType) {
        return { valid: false, message: "Employment type is required." };
    }

    return { valid: true };
};

export const sanitizeExperience = (exp: Partial<Experience>): Experience => {
    return {
        ...exp,

        applicant:
            typeof exp.applicant === "object" && exp.applicant !== null
                ? (exp.applicant as Applicant)._id
                : exp.applicant,

        organization:
            typeof exp.organization === "object" && exp.organization !== null
                ? (exp.organization as Organization)._id
                : exp.organization,

        rank:
            typeof exp.rank === "object" && exp.rank !== null
                ? (exp.rank as any)._id
                : exp.rank,
    } as Experience;
};

export interface GetExperiencesOptions {
    applicant?: string | Applicant;
}



