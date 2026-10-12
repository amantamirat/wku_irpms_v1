import { User } from "../../users/models/user.model";

export enum AccountStatus {
    pending = 'pending',
    active = 'active',
    suspended = 'suspended'
}

export type Account = {
    _id?: string;
    user?: string | User;
    email?: string;
    password?: string;
    currentPassword?: string;
    confirmedPassword?: string;
    resetCode?: string;
    resetCodeExpires?: Date;
    status?: AccountStatus;
    iat?: number;
    exp?: number;
};

export const validateAccount = (
    user: Account, 
    skipPassword: boolean = false, 
    currentPassword: boolean = false, 
    regexPassword: boolean = true
): { valid: boolean; message?: string } => {
    if (!user.email || user.email.trim() === "") {
        return { valid: false, message: "Email is required." };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
        return { valid: false, message: "Email is not valid." };
    }
    if (!user.user) {
        return { valid: false, message: "User is required." };
    }

    if (currentPassword) {
        if (!user.currentPassword || user.currentPassword.trim() === "") {
            return { valid: false, message: "Current Password is required." };
        }
    }

    // Skip validation if password is optional (e.g. updating an account without changing password)
    if (!skipPassword) {
        if (!user.password || user.password.trim() === "") {
            return { valid: false, message: "Password is required." };
        }

        if (regexPassword) {
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
    } else {
        // If password is provided, validate it even if skipPassword is true (i.e. user typed a new password)
        if (user.password && user.password.trim() !== "") {
            if (regexPassword) {
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
        }
    }

    return { valid: true };
};

/*
export function sanitizeAccount(user: Partial<Account>): Partial<Account> {
    return {
        ...user,
        user:
            typeof user.user === 'object' && user.user !== null
                ? (user.user as any)._id
                : user.user,
    };
}
*/

export const createEmptyAccount = (): Account => ({
});