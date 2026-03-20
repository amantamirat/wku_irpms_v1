export interface UpdatePermissionDto {
    id: string;
    data: Partial<{
        name: string;
        description: string;
    }>;
}