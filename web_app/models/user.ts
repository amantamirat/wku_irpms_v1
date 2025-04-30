import { Role } from "./role";

export type UserStatus = 'Pending' | 'Activated' | 'Suspended'
export type User = {
    _id?: string;
    user_name: string;
    email: string;
    password?: string;
    status: UserStatus;
};

export const validateUser = (user: User): boolean => {
    if (user.user_name.trim() === "" || user.email === "") {
        return false;
    }
    return true;
};