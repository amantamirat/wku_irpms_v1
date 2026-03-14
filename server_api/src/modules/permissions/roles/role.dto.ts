export interface CreateRoleDto {
    name: string;
    permissions: string[];
    isDefault?: boolean;
}

export interface UpdateRoleDto {
    id: string;
    data: Partial<{
        name: string;
        permissions: string[];
        isDefault: boolean;
    }>;
    userId?: string;
}