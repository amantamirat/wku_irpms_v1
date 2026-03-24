import { EvalStatus } from "./evaluation.state-machine";

export interface CreateEvaluationDTO {
    title: string;
    description: string;
    weight: number;
    userId?: string;
}

export interface UpdateEvaluationDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
        weight: number;
        status: EvalStatus;
    }>;
    userId?: string;
}

export interface GetEvaluationsDTO {
    status?: EvalStatus;
}
