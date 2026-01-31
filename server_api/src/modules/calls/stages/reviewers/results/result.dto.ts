//result.dto.ts

export interface GetResultsDTO {
    reviewer?: string;
    populate?: boolean;
}

export interface ExistsResultsDTO {
    reviewer?: string;
    criterion?: string;
    selectedOption?: string;
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

