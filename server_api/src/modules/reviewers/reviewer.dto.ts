
// reviewer.dto.ts
export interface GetReviewersDTO {
    projectStage?: string;
    reviewer?: string;
    populate?: boolean;
    status?: string | string[]; // Add this
}

export interface CreateReviewerDTO {
    projectStage: string;
    reviewer: string;
    weight: number;
    userId?: string;
}

export interface UpdateReviewerDTO {
    id: string;
    data: Partial<{
        score: number;
        weight: number;
    }>;
    userId: string;
}



export interface ExistsReviewersDTO {
    reviewer?: string;
    projectStage?: string;
}

