//result.dto.ts

export interface GetResultsDTO {
    reviewer?: string;
    populate?: boolean;
}

export interface ExistsResultsDTO {
    reviewer?: string;
    criterion?: string;
}

export interface CreateResultDTO {
    reviewer: string;
    criterion: string;
    score?: number | null;
    selectedOptions?: string;
    comment?: string;
    applicantId?: string;
}

export interface UpdateResultDTO {
    id: string;
    data: Partial<{
        score: number | null;
        selectedOptions: string[];
        comment: string;
    }>;
    applicantId: string;
}

