import { AccountStatus } from './account.model';


export interface CreateAccountDTO {
    applicant: string;
    email: string;
    password: string;
    status?: AccountStatus;
}

export interface UpdateAccountDTO {
    id: string;
    data: Partial<{
        password: string;
        lastLogin: Date;
        failedLoginAttempts: number;
        lockUntil: Date | null;
        resetCode: string;
        resetCodeExpires: Date;
        status: AccountStatus;
    }>;
    userId?: string;
}


export interface VerfyAccountDto {
    email: string;
    password?: string;
    resetCode: string;
}
