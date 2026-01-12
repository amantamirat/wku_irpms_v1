export interface GetGrantsDTO {
    directorate?: string;
}

export interface CreateGrantDTO {
    directorate: string;
    title: string;
    description?: string;
    userId: string;
}

export interface UpdateGrantDTO {
    id: string;
    data: Partial<{
        title: string;
        description?: string;
    }>;
    userId: string;
}

export interface DeleteGrantDTO {
    id: string;
    userId: string;
}