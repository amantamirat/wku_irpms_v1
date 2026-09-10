
export type Role = {
    _id?: string;
    name: string;
    permissions: string[];
    isDefault: boolean;
};

export const validateRole = (role: Role): { valid: boolean; message?: string } => {
    if (!role.name || role.name.trim() === '') {
        return { valid: false, message: ' Role Name is required.' };
    }
    if (!role.permissions || role.permissions.length === 0) {
        return { valid: false, message: "At least one permission is required." };
    }
    return { valid: true };
}



export const createEmptyRole = (): Role => ({
    name: "",
    permissions: [],
    isDefault: false
})
