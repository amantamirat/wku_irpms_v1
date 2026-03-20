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
        //evaluation: string;
    }>;
}

export interface GetStageDTO {
    grant?: string;
    evaluation?: string;
    order?: number;
    populate?: boolean;
}

export interface ExistsStageDTO {
    grant?: string;
    evaluation?: string;
}





