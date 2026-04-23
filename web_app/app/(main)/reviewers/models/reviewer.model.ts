import { User } from "@/app/(main)/users/models/user.model";
import { ProjectStage } from "../../projects/stages/models/project.stage.model";

export enum ReviewerStatus {
    pending = 'pending',
    accepted = 'accepted',
    submitted = 'submitted',
    approved = 'approved'
}

export type Reviewer = {
    _id?: string;
    projectStage?: string | ProjectStage;
    applicant?: string | User;
    weight?: number;
    score?: number;
    status: ReviewerStatus;
    createdAt?: Date;
    updatedAt?: Date;
}


export interface GetReviewersOptions {
    applicant?: string | User;
    projectStage?: string | ProjectStage;
    populate?: boolean;
}

export const validateReviewer = (reviewer: Reviewer): { valid: boolean; message?: string } => {
    if (!reviewer.projectStage) {
        return { valid: false, message: 'Project stage is required.' };
    }
    if (!reviewer.applicant) {
        return { valid: false, message: 'Applicant is required.' };
    }
    return { valid: true };
};

export const sanitizeReviewer = (reviewer: Partial<Reviewer>): Reviewer => {
    return {
        ...reviewer,
        projectStage:
            typeof reviewer.projectStage === "object" && reviewer.projectStage !== null
                ? (reviewer.projectStage as any)._id
                : reviewer.projectStage,
        applicant:
            typeof reviewer.applicant === "object" && reviewer.applicant !== null
                ? (reviewer.applicant as User)._id
                : reviewer.applicant,
    } as Reviewer;
};


