import { AccountStatus } from "./account.model";

export const ACCOUNT_STATUS_ORDER: AccountStatus[] = [
    AccountStatus.pending,
    AccountStatus.active,
    AccountStatus.suspended
];

export const ACCOUNT_TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
    [AccountStatus.pending]: [AccountStatus.active],
    [AccountStatus.active]: [AccountStatus.suspended, AccountStatus.pending],
    [AccountStatus.suspended]: [AccountStatus.active]
};