
// reviewer.dto.ts
export interface GetReviewersDTO {
    application?: string;
    reviewer?: string;
    populate?: boolean;
    status?: string | string[]; // Add this
}

export interface CreateReviewerDTO {
    application: string;
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
    application?: string;
}

