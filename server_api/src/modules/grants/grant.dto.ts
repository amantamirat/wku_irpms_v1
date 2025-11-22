export interface GetGrantsDTO {
    directorateId?: string;
}

export interface CreateGrantDTO {
    directorateId: string;
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