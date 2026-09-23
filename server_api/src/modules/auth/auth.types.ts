import { AccountStatus } from "../accounts/account.model";

export type ScopeFilter = Record<string, unknown>;

export type AuthScope = string[] | "*" | null;

export interface JwtPayload {
    accountId: string;
    userId: string;
    email: string;
    status: AccountStatus;
    scope: AuthScope;
    iat?: number;
    exp?: number;
}