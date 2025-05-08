import { Role } from "./role";

export enum UserStatus {
    Pending = 'Pending',
    Active = 'Active',
    Suspended = 'Suspended'
}
export type User = {
    _id?: string;
    user_name: string;
    email: string;
    password?: string;
    status: UserStatus;
    reset_code?:string;
    reset_code_expires?:Date;
};

export const validateUser = (user: User): boolean => {
    if (user.user_name.trim() === "" || user.email === "") {
        return false;
    }
    return true;
};