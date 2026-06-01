import { User } from "@/app/(main)/users/models/user.model";
import { ProjectApplication } from "../../projects/applications/models/project.application.model";

export enum ReviewerStatus {
    pending = 'pending',
    accepted = 'accepted',
    submitted = 'submitted',
    approved = 'approved'
}

export type Reviewer = {
    _id?: string;
    projectStage?: string | ProjectApplication;
    reviewer?: string | User;
    weight?: number;
    score?: number;
    status: ReviewerStatus;
    createdAt?: Date;
    updatedAt?: Date;
}


export interface GetReviewersOptions {
    reviewer?: string | User;
    projectStage?: string | ProjectApplication;
    status?: ReviewerStatus | ReviewerStatus[];
    populate?: boolean;
}

export const validateReviewer = (reviewer: Reviewer): { valid: boolean; message?: string } => {
    if (!reviewer.projectStage) {
        return { valid: false, message: 'Project stage is required.' };
    }
    if (!reviewer.reviewer) {
        return { valid: false, message: 'Reviewer is required.' };
    }
    return { valid: true };
};

export const sanitizeReviewer = (reviewer: Partial<Reviewer | GetReviewersOptions>): Reviewer => {
    return {
        ...reviewer,
        projectStage:
            typeof reviewer.projectStage === "object" && reviewer.projectStage !== null
                ? (reviewer.projectStage as any)._id
                : reviewer.projectStage,
        reviewer:
            typeof reviewer.reviewer === "object" && reviewer.reviewer !== null
                ? (reviewer.reviewer as User)._id
                : reviewer.reviewer
    } as Reviewer;
};


