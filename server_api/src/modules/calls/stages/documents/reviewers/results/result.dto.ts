//result.dto.ts

export interface GetResultsDTO {
    reviewerId: string;
}

export interface CreateResultDTO {
    reviewer: string;
    criterion: string;
    score?: number;
    selectedOption?: string;
    comment?: string;
    applicantId: string;
}

export interface UpdateResultDTO {
    id: string;
    data: Partial<{
        score: number;
        selectedOption: string;
        comment: string;
    }>;
    applicantId: string;
}

