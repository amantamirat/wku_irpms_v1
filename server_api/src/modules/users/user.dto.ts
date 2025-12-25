import { UserStatus } from "./user.status";

export interface CreateUserDTO {
    applicant?: string;
    email: string;
    password: string;
    status?: UserStatus;
}

export interface UpdateUserDTO {
    id: string;
    data: Partial<{
        password: string;
        lastLogin: Date;
        resetCode: string;
        resetCodeExpires: Date;
        status: UserStatus;
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

export interface VerfyUserDto {
    email: string;
    password?: string;
    resetCode: string;
}

export default interface JwtPayload {
    userId: string;
    applicantId: string;
    email: string;
    status: UserStatus;
    iat?: number;
    exp?: number;
}