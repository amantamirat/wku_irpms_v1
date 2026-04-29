
export interface LoginDto {
    email: string;
    password: string;
}

export interface ChangePasswordDTO {
    currentPassword: string;
    password: string;
}

export const validateLogin = (dto: LoginDto): { valid: boolean; message?: string; } => {

    if (!dto.email || dto.email.trim() === "") {
        return { valid: false, message: "Email is required." };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
        return { valid: false, message: "Email is not valid." };
    }

    if (!dto.password || dto.password.trim() === "") {
        return { valid: false, message: "Password is required." };
    }
    return { valid: true };
};

