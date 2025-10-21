import { Permission } from "../permission/model/permission.model";

export type Role = {
    _id?: string;
    role_name: string;
    permissions: string[] | Permission[];
};

export const validateRole = (role: Role): { valid: boolean; message?: string } => {
    if (!role.role_name || role.role_name.trim() === '') {
        return { valid: false, message: ' Role Name is required.' };
    }
     if (!role.permissions || role.permissions.length === 0) {
        return { valid: false, message: "At least one permission is required." };
    }
    return { valid: true };
}