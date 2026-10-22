// reviewer.dto.ts
import { ReviewerTargetType } from "./reviewer.model";
import { ReviewerStatus } from "./reviewer.state-machine";


export interface FilterReviewersDto {
    project?: string;
    application?: string;
    verification?: string;
    reviewer?: string;
    evaluation?:string;
    status?: ReviewerStatus | ReviewerStatus[];
}


export interface CreateReviewerDTO {
    targetType: ReviewerTargetType;
    application?: string;
    verification?: string;
    reviewer: string;
    weight: number;
}


export interface UpdateReviewerDTO {
    id: string;
    data: Partial<{
        score: number;
        weight: number;
    }>;
}


