export interface CreateRoleDto {
    roleName: string;
    permissions: string[];
}

export interface UpdateRoleDto {
    id: string;
    data: Partial<{
        roleName: string;
        permissions: string[];
    }>;
    userId?: string;
}