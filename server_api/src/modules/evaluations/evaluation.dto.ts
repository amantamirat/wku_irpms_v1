
export interface CreateEvaluationDTO {
    directorate: string;
    title: string;
    userId: string;
}

export interface UpdateEvaluationDTO {
    id: string;
    data: Partial<{
        title: string;
    }>;
    userId: string;
}

export interface GetEvaluationsDTO {
    directorate?: string;
    populate?: boolean;
}
