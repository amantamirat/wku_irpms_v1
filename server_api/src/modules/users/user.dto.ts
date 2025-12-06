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