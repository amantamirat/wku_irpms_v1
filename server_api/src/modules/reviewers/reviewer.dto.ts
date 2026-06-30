
// reviewer.dto.ts
export interface GetReviewersDTO {
    projectApplication?: string;
    reviewer?: string;
    populate?: boolean;
    status?: string | string[]; // Add this
}

export interface CreateReviewerDTO {
    projectApplication: string;
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
    projectApplication?: string;
}

