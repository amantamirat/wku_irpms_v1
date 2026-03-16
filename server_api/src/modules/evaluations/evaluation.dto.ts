import { EvalStatus } from "./evaluation.state-machine";

export interface CreateEvaluationDTO {
    organization: string;
    title: string;
    description:string;
    userId?: string;
}

export interface UpdateEvaluationDTO {
    id: string;
    data: Partial<{
        title: string;
        description:string;
        status: EvalStatus;
    }>;
    userId?: string;
}

export interface GetEvaluationsDTO {
    organization?: string;
    populate?: boolean;
}
