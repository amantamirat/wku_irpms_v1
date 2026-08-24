

// reviewer.dto.ts

import { ReviewerTargetType } from "./reviewer.model";
import { ReviewerStatus } from "./reviewer.state-machine";



export interface FilterReviewersDto {
    application?: string;
    verification?: string;
    reviewer?: string;
    status?: ReviewerStatus | ReviewerStatus[];
}


export interface CreateReviewerDTO {
    targetType: ReviewerTargetType;
    application?: string;
    verification?: string;
    reviewer: string;
    weight: number;
    userId?: string;
}


export interface UpdateReviewerDTO {
    id: string;
    data: Partial<{
        score: number;
        weight: number;
    }>;
    userId: string;
}


