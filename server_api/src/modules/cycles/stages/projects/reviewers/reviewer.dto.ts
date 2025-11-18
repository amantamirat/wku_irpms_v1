import { ReviewerStatus } from "./reviewer.enum";

// reviewer.dto.ts
export interface GetReviewersDTO {
    projectStageId?: string;
    applicantId?: string;
}

export interface CreateReviewerDTO {
    projectStageId: string;
    applicantId: string;
    userId: string;
}

export interface UpdateReviewerDTO {
    id: string;
    data: Partial<{
        status: ReviewerStatus;
        totalScore: number;
    }>;
    userId: string;
}

export interface DeleteReviewerDTO {
    id: string;
    userId: string;
}
