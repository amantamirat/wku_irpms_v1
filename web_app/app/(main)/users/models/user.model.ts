import { Applicant } from "../../applicants/models/applicant.model";
import { Role } from "../../roles/models/role.model";



export enum UserStatus {
    Pending = 'Pending',
    Active = 'Active',
    Suspended = 'Suspended',
    Deleted = 'Deleted'
}

export type PasswordType = {
    _id: string;
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
};
export type User = {
    _id?: string;
    user_name: string;
    email: string;
    password?: string;
    confirmed_password?: string;
    roles?: Role[] | string[];
    reset_code?: string;
    reset_code_expires?: Date;
    linkedApplicant?: string | Applicant;
    status?: UserStatus;
};


export const validateUser = (user: User): { valid: boolean; message?: string } => {
    if (!user.user_name || user.user_name.trim() === "") {
        return { valid: false, message: "Username is required." };
    }
    if (!user.email || user.email.trim() === "") {
        return { valid: false, message: "Email is required." };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
        return { valid: false, message: "Email is not valid." };
    }

    if (!user.roles || user.roles.length === 0) {
        return { valid: false, message: "At least one role is required." };
    }

    if (!user._id && !user.password) {
        return { valid: false, message: "Password is required." };
    }
    if (user.password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
        if (!passwordRegex.test(user.password)) {
            return {
                valid: false,
                message:
                    "Password must be at least 8 characters long, include uppercase, lowercase, number, and symbol."
            };
        }
        if (!user.confirmed_password) {
            return { valid: false, message: "Password confirmation required" };
        }
        if (user.password !== user.confirmed_password) {
            return { valid: false, message: "Password mismatch" };
        }
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
        roles: user.roles
            ?.map((role) => {
                if (!role) return undefined;
                if (typeof role === "object" && "_id" in role) {
                    return (role as any)._id.toString(); // ensure string
                }
                return role;
            })
            .filter((r): r is string => typeof r === "string"),
    };
}

