export interface CreateRoleDto {
    role_name: string;
    permissions: string[];
}

export interface UpdateRoleDto {
    id: string;
    data: Partial<{
        role_name: string;
        permissions: string[];
    }>;
    userId?: string;
}