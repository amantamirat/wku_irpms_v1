import { Role } from "./role";

export type UserStatus = 'Pending' | 'Activated' | 'Suspended'
export type User = {
    _id?: string;
    name: string;
    password?: string;
    email?: string;
    roles?: Role[];
    status: UserStatus;
};