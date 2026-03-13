import { UserStatus } from "./user.model";

export const USER_STATUS_ORDER: UserStatus[] = [
    UserStatus.pending,
    UserStatus.active,
    UserStatus.suspended
];

export const USER_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
    [UserStatus.pending]: [UserStatus.active],
    [UserStatus.active]: [UserStatus.suspended, UserStatus.pending],
    [UserStatus.suspended]: [UserStatus.active]
};