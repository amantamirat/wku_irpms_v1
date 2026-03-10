import { AuthStatus } from "./auth.status";

export interface CreateAuthDTO {
    applicant: string;
    email?: string;
    password: string;
    status?: AuthStatus;
}

export interface UpdateAuthDTO {
    id: string;
    data: Partial<{
        password: string;
        lastLogin: Date;
        resetCode: string;
        resetCodeExpires: Date;
        status: AuthStatus;
    }>;
    userId?: string;
}

export interface ChangePasswordDTO {
    id: string;
    data: {
        currentPassword: string;
        password: string;
    };
    userId?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface VerfyAuthDto {
    email: string;
    password?: string;
    resetCode: string;
}

export default interface JwtPayload {
    userId: string;
    applicantId: string;
    email: string;
    status: AuthStatus;
    iat?: number;
    exp?: number;
}