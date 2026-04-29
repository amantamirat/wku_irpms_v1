import { AccountStatus } from '../accounts/account.model';

export interface LoginDto {
    email: string;
    password: string;
}

export default interface JwtPayload {
    accountId?: string;
    userId: string;
    email: string;
    status: AccountStatus;
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