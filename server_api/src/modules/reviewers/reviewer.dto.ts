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
    weight: number;
    applicantId?: string;
}

export interface UpdateReviewerDTO {
    id: string;
    data: Partial<{
        score: number;
        weight: number;
    }>;
    applicantId: string;
}



export interface ExistsReviewersDTO {
    applicant?: string;
    projectStage?: string;
}

