import { AccountStatus } from './account.model';


export interface CreateAccountDTO {
    user: string;
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
        resetCode: string | null;
        resetCodeExpires: Date | null;
        status: AccountStatus;
    }>;
    userId?: string;
}

export interface FilterAccountDTO {
    user?: string;
    email?: string;
    status?: AccountStatus;
}



