

export interface FindStageDTO {
    grant: string;
    order: number;
}

export interface GetStageDTO {
    grant?: string;
    order?: number;
    populate?: boolean;
}

export interface CreateStageDTO {
    grant: string;
    name: string;
    order?: number;
    evaluation: string;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        name: string;
        evaluation: string;
    }>;
}





