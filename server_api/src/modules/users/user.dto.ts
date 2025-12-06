import { UserStatus } from "./user.enum";

export interface CreateUserDTO {
    applicant?: string;
    password: string;
    email: string;
    status?: UserStatus;
    //createdBy?: string;
}

export interface UpdateUserDTO {
    id: string;
    data: Partial<{
        lastLogin: Date,
        password: string;
        status: UserStatus;
    }>;
    userId?: string;
}

export interface ChangePasswordDTO {
    id: string;
    data: {
        oldPassword: string;
        newPassword: string;
    };
    userId: string;
}

export interface LoginDto {
    email: string;
    password: string;
}


export default interface JwtPayload {
    _id: string;
    applicantId: string;
    email: string;
    status: UserStatus;
    iat?: number;
    exp?: number;
}