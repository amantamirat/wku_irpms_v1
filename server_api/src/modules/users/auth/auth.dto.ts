import { UserStatus } from "../user.state-machine";

export interface LoginDto {
    email: string;
    password: string;
}

export default interface JwtPayload {
    applicantId: string;
    email: string;
    status: UserStatus;
    iat?: number;
    exp?: number;
}

export interface ChangePasswordDTO {
    id: string;
    data: {
        currentPassword: string;
        password: string;
    };
    userId?: string;
}