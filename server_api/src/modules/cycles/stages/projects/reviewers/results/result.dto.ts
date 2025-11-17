//result.dto.ts

export interface GetResultsDTO {
    reviewerId: string;
}

export interface CreateResultDTO {
    reviewerId: string;
    criterionId: string;
    score?: number;
    selectedOptionId?: string;
    comment?: string;
    userId: string;
}

export interface UpdateResultDTO {
    id: string;
    data: Partial<{
        score: number;
        selectedOptionId: string;
        comment: string;
    }>;
    userId: string;
}

export interface DeleteResultDTO {
    id: string;
    userId: string;
}
