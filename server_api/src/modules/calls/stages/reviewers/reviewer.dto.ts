import { ReviewerStatus } from "./reviewer.status";

// reviewer.dto.ts
export interface GetReviewersDTO {
    projectStage?: string;
    applicant?: string;
}

export interface CreateReviewerDTO {
    projectStage: string;
    applicant: string;
    weight?: number;
    userId: string;
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
