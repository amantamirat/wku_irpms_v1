export type LoginDto = {
    user_name: string;
    password: string;
}

export type VerfyUserDto = {
    email: string;
    password?: string;
    reset_code: string;
    confirmed_password?: string;
}

export enum UserStatus {
    Pending = 'Pending',
    Active = 'Active'
}

export type User = {
    _id: string;
    //email?: string;
    user_name: string;
    status: UserStatus;
    linkedApplicant?: any;
    //roles?: any;
    permissions?: string[];
    organizations?: any;
    iat?: number;
    exp?: number;
}

export const validateLogin = (login: LoginDto): { valid: boolean; message?: string } => {
    if (!login.user_name || login.user_name.trim() === "") {
        return { valid: false, message: "Username is required." };
    }
    if (!login.password || login.password.trim() === "") {
        return { valid: false, message: "Password is required." };
    }
    return { valid: true };
};


export const validateVerification = (vu: VerfyUserDto): { valid: boolean; message?: string } => {
    if (!vu.email || vu.email.trim() === "") {
        return { valid: false, message: "email required." };
    }
    if (!vu.reset_code || vu.reset_code.trim() === "") {
        return { valid: false, message: "verification code required." };
    }
    if (vu.password) {
        if (!vu.confirmed_password) {
            return { valid: false, message: "Password confirmation required" };
        }
        if (vu.password !== vu.confirmed_password) {
            return { valid: false, message: "Password mismatch" };
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
        if (!passwordRegex.test(vu.password)) {
            return {
                valid: false,
                message:
                    "Password must be at least 8 characters long, include uppercase, lowercase, number, and symbol."
            };
        }
    }
    return { valid: true };
};
