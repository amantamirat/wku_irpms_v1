import { Applicant } from "../../applicants/models/applicant.model";

export enum UserStatus {
    pending = 'Pending',
    active = 'Active',
    deleted = 'Deleted'
}

export type PasswordType = {
    _id: string;
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
};
export type User = {
    _id?: string;
    applicant?: string | Applicant;
    email: string;
    password: string;
    currentPassword?: string;
    confirmedPassword?: string;
    reset_code?: string;
    reset_code_expires?: Date;
    status?: UserStatus;
    //credential informations
    permissions?: string[];
    organizations?: any;
    iat?: number;
    exp?: number;
};


export const validateUser = (user: User): { valid: boolean; message?: string } => {
    if (!user.email || user.email.trim() === "") {
        return { valid: false, message: "Email is required." };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
        return { valid: false, message: "Email is not valid." };
    }

    if (!user.password || user.password.trim() === "") {
        return { valid: false, message: "Password is required." };
    }

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

    return { valid: true };
};


export const validatePassword = (password: PasswordType): { valid: boolean; message?: string } => {

    if (!password._id || password._id.trim() === "") {
        return { valid: false, message: "Password id is required." };
    }
    if (!password.newPassword) {
        return { valid: false, message: "Password required" };
    }
    if (!password.confirmPassword) {
        return { valid: false, message: "Password confirmation required" };
    }
    if (password.newPassword !== password.confirmPassword) {
        return { valid: false, message: "Password mismatch" };
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    if (!passwordRegex.test(password.newPassword)) {
        return {
            valid: false,
            message:
                "Password must be at least 8 characters long, include uppercase, lowercase, number, and symbol."
        };
    }
    return { valid: true };
};


export function sanitizeUser(user: Partial<User>): Partial<User> {
    return {
        ...user,
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



