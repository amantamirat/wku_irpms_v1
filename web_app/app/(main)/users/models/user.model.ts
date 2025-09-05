import { Applicant } from "../../applicants/models/applicant.model";
import { Role } from "../../roles/models/role.model";



export enum UserStatus {
    Pending = 'Pending',
    Active = 'Active',
    Suspended = 'Suspended'
}
export type User = {
    _id?: string;
    user_name: string;
    email: string;
    password?: string;
    roles: Role[];
    reset_code?: string;
    reset_code_expires?: Date;
    linkedApplicant?: string | Applicant;
    status: UserStatus;
};


export const validateUser = (
    user: User
): { valid: boolean; message?: string } => {
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

    if (user.password !== undefined && user.password.trim().length < 6) {
        return { valid: false, message: "Password must be at least 6 characters long." };
    }

    return { valid: true };
};
