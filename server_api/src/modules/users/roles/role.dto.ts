export interface CreateRoleDto {
    name: string;
    permissions: string[];
}

export interface UpdateRoleDto {
    id: string;
    data: Partial<{
        name: string;
        permissions: string[];
    }>;
    userId?: string;
}