import { UserStatus } from "./user.enum";

export interface CreateUserDTO {
    user_name: string;
    password: string;
    email: string;
    roles: string[];
    organizations?: string[];
    status?: UserStatus;
    createdBy?: string;
}

export interface UpdateUserDTO {
    id: string;
    data: Partial<{
        roles: string[];
        organizations?: string[];
    }>;
    userId: string;
}

export interface GetUsersDTO {
    deleted?: boolean;
}
