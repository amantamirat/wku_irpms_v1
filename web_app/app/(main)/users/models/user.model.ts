import { Applicant } from "../../applicants/models/applicant.model";

export enum UserStatus {
    pending = 'pending',
    active = 'active',
    suspended = 'suspended'
}

export type User = {
    _id?: string;
    applicant?: string | Applicant;
    email?: string;
    password?: string;
    currentPassword?: string;
    confirmedPassword?: string;
    resetCode?: string;
    resetCodeExpires?: Date;
    status?: UserStatus;
    //other informations
    //permissions?: string[];
    //organizations?: any;
    iat?: number;
    exp?: number;
};


export const validateUser = (user: User, currentPassword: boolean = false, regexPasswprd: boolean = true): { valid: boolean; message?: string } => {
    /*
    if (!user.email || user.email.trim() === "") {
        return { valid: false, message: "Email is required." };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
        return { valid: false, message: "Email is not valid." };
    }
        */
    if (!user.applicant) {
        return { valid: false, message: "Applicant is required." };
    }
    if (currentPassword) {
        if (!user.currentPassword || user.currentPassword.trim() === "") {
            return { valid: false, message: "Current Password is required." };
        }
    }

    if (!user.password || user.password.trim() === "") {
        return { valid: false, message: "Password is required." };
    }

    if (regexPasswprd) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
        if (!passwordRegex.test(user.password)) {
            return {
                valid: false,
                message:
                    "Password must be at least 8 characters long, include uppercase, lowercase, number, and symbol."
            };
        }
        if (!user.confirmedPassword) {
            return { valid: false, message: "Password confirmation required" };
        }
        if (user.password !== user.confirmedPassword) {
            return { valid: false, message: "Password mismatch" };
        }
    }
    return { valid: true };
};



export function sanitizeUser(user: Partial<User>): Partial<User> {
    return {
        ...user,
        applicant:
            typeof user.applicant === 'object' && user.applicant !== null
                ? (user.applicant as any)._id
                : user.applicant,
        /*
        roles: user.roles
            ?.map(role =>
                typeof role === 'object' && role !== null
                    ? (role as Role)._id
                    : role
            )
            .filter((id): id is string => typeof id === 'string'),

        organizations: user.organizations
            ?.map(org =>
                typeof org === 'object' && org !== null
                    ? (org as Organization)._id
                    : org
            )
            .filter((id): id is string => typeof id === 'string'),
            */
    };
}



