
export interface CreateStageDTO {
    call: string;
    name: string;
    order?: number;
    deadline: Date;

    template?: string;

    evaluation: string;
    minReviewers: number;
    maxReviewers: number;
    minAcceptanceScore: number;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        name: string;
        deadline: Date;

        template: string | null;

        minReviewers: number;
        maxReviewers: number;
        minAcceptanceScore: number;
    }>;
}

export interface GetStageDTO {
    call?: string;
    evaluation?: string;
    order?: number;
    populate?: boolean;
}

export interface ExistsStageDTO {
    call?: string;
    evaluation?: string;
    order?: number;
}