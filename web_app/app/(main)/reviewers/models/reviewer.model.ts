import { User } from "@/app/(main)/users/models/user.model";
import { Application } from "../../applications/models/application.model";

export enum ReviewerStatus {
    pending = 'pending',
    accepted = 'accepted',
    submitted = 'submitted',
    approved = 'approved'
}

export type Reviewer = {
    _id?: string;
    application?: string | Application;
    reviewer?: string | User;
    weight?: number;
    score?: number;
    status: ReviewerStatus;
    createdAt?: Date;
    updatedAt?: Date;
}


export interface GetReviewersOptions {
    reviewer?: string | User;
    application?: string | Application;
    status?: ReviewerStatus | ReviewerStatus[];
}

export const validateReviewer = (reviewer: Reviewer): { valid: boolean; message?: string } => {
    if (!reviewer.application) {
        return { valid: false, message: 'Application is required.' };
    }
    if (!reviewer.reviewer) {
        return { valid: false, message: 'Reviewer is required.' };
    }
    return { valid: true };
};

export const sanitizeReviewer = (reviewer: Partial<Reviewer | GetReviewersOptions>): Reviewer => {
    return {
        ...reviewer,
        application:
            typeof reviewer.application === "object" && reviewer.application !== null
                ? (reviewer.application as any)._id
                : reviewer.application,
        reviewer:
            typeof reviewer.reviewer === "object" && reviewer.reviewer !== null
                ? (reviewer.reviewer as User)._id
                : reviewer.reviewer
    } as Reviewer;
};


