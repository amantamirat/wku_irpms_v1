import { User } from "@/app/(main)/users/models/user.model";
import { Organization } from "@/app/(main)/organizations/models/organization.model";
import { Position } from "../../../positions/models/position.model";

export enum EmploymentType {
    FullTime = "Full-Time",
    PartTime = "Part-Time",
    Contract = "Contract",
    Internship = "Internship",
    Volunteer = "Volunteer",
}

export type Experience = {
    _id?: string;
    user?: string | User;
    organization?: string | Organization;
    position?: string | Position;
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

    if (!exp.user) {
        return { valid: false, message: "User is required." };
    }

    if (!exp.organization) {
        return { valid: false, message: "Organization is required." };
    }

    if (!exp.position) {
        return { valid: false, message: "Position is required." };
    }

    if (!exp.startDate) {
        return { valid: false, message: "Start date is required." };
    }

    if (!exp.employmentType) {
        return { valid: false, message: "Employment type is required." };
    }

    const now = new Date();

    const startDate = new Date(exp.startDate);

    // ✅ Start date must be less than now
    if (startDate >= now) {
        return { valid: false, message: "Start date must be in the past." };
    }

    // ✅ If not current → end date is required
    if (exp.isCurrent === false) {
        if (!exp.endDate) {
            return { valid: false, message: "End date is required if not currently employed." };
        }
    }

    // ✅ If end date exists → it must be after start date
    if (exp.endDate) {
        const endDate = new Date(exp.endDate);

        if (endDate <= startDate) {
            return { valid: false, message: "End date must be after start date." };
        }
    }

    // ✅ If current → end date should not exist
    if (exp.isCurrent === true && exp.endDate) {
        return { valid: false, message: "Current employment should not have an end date." };
    }

    return { valid: true };
};


export const sanitizeExperience = (exp: Partial<Experience>): Experience => {
    return {
        ...exp,

        user:
            typeof exp.user === "object" && exp.user !== null
                ? (exp.user as User)._id
                : exp.user,

        organization:
            typeof exp.organization === "object" && exp.organization !== null
                ? (exp.organization as Organization)._id
                : exp.organization,

        position:
            typeof exp.position === "object" && exp.position !== null
                ? (exp.position as any)._id
                : exp.position,
    } as Experience;
};

export interface GetExperiencesOptions {
    user?: string | User;
}



