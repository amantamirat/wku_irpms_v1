import { ReviewerStatus } from "./reviewer.status";

// reviewer.dto.ts
export interface GetReviewersDTO {
    projectStage?: string;
    applicant?: string;
    populate?: boolean;
}

export interface CreateReviewerDTO {
    projectStage: string;
    applicant: string;
    weight?: number;
    // userId: string;
}

export interface UpdateReviewerDTO {
    id: string;
    data: Partial<{
        score: number;
        weight: number;
        status: ReviewerStatus;
    }>;
    applicantId: string;
}

export interface UpdateReviewerStatusDTO {
    id: string;
    status: ReviewerStatus;
    applicantId: string;
}

export interface ExistsReviewersDTO {
    applicant?: string;
    projectStage?: string;
}

