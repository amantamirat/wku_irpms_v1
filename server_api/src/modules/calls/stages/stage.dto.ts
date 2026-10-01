
export interface CreateStageDTO {
    call: string;
    name: string;

    deadline: Date;
    reviewersDeadline?: Date;

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
        
        reviewersDeadline?: Date;

        template: string | null;

        evaluation: string;

        minReviewers: number;
        maxReviewers: number;
        minAcceptanceScore: number;
    }>;
}

export interface FilterStageDto {
    call?: string;
    evaluation?: string;
    order?: number;
}