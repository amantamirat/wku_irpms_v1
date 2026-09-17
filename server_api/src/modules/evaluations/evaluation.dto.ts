import { ResourceStatus } from "./evaluation.state-machine";

export interface CreateEvaluationDTO {
    title: string;
    description: string;
    weight: number;
    userId?: string;
    status?: ResourceStatus;
}

export interface UpdateEvaluationDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
        weight: number;
        status: ResourceStatus;
    }>;
    userId?: string;
}

export interface FilterEvaluationsDTO {
    title?: string;
    weight?: number;
    status?: ResourceStatus;
}
