import { UserStatus } from "./user.state-machine";


export interface CreateUserDTO {
    applicant: string;
    email: string;
    password: string;
    status?: UserStatus;
}

export interface UpdateUserDTO {
    id: string;
    data: Partial<{
        password: string;
        lastLogin: Date;
        failedLoginAttempts: number;
        lockUntil: Date | null;
        resetCode: string;
        resetCodeExpires: Date;
        status: UserStatus;
    }>;
    userId?: string;
}





export interface VerfyUserDto {
    email: string;
    password?: string;
    resetCode: string;
}

