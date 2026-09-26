//result.dto.ts

export interface FilterResultsDTO {
    reviewer?: string;
    criterion?: string;
}


export interface CreateResultDTO {
    reviewer: string;
    criterion: string;
    score?: number | null;
    selectedOptions?: string;
    comment?: string;
}

export interface UpdateResultDTO {
    id: string;
    data: Partial<{
        score: number | null;
        selectedOptions: string[];
        comment: string;
    }>;
}

