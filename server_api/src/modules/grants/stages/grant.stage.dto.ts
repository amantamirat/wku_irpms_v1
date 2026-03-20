export interface CreateStageDTO {
    grant: string;
    name: string;
    order?: number;
    evaluation: string;
    minReviewers: number;
    maxReviewers: number;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        name: string;
        minReviewers: number;
        maxReviewers: number;
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





