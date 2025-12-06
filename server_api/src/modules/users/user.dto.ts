import { UserStatus } from "./user.enum";

export interface CreateUserDTO {
    applicant?: string;
    user_name: string;
    password: string;
    email: string;
    //roles: string[];
    //organizations?: string[];
    status?: UserStatus;
    createdBy?: string;
}

export interface UpdateUserDTO {
    id: string;
    data: Partial<{
        //roles: string[];
        //organizations: string[];
        password: string;
        status: UserStatus;
    }>;
    userId?: string;
}

/*
export interface GetUsersDTO {
    status?: UserStatus;
}
    */

export interface ChangePasswordDTO {
    id: string;
    data: {
        oldPassword: string;
        newPassword: string;
    };
    userId: string;
}