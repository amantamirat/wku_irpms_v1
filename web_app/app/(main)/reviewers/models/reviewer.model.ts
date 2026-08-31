import { User } from "@/app/(main)/users/models/user.model";
import { Application } from "../../applications/models/application.model";
import { Verification } from "../../verifications/models/verification.model";
import { Project } from "../../projects/models/project.model";
// Import Verification model if available, e.g.:
// import { Verification } from "../../verifications/models/verification.model";

export enum ReviewerTargetType {
    APPLICATION = 'APPLICATION',
    VERIFICATION = 'VERIFICATION'
}

export enum ReviewerStatus {
    pending = 'pending',
    accepted = 'accepted',
    submitted = 'submitted',
    approved = 'approved'
}

export type Reviewer = {
    _id?: string;
    targetType: ReviewerTargetType;
    reviewer?: string | User;
    project?: string | Project;
    application?: string | Application;
    verification?: string | Verification;
    weight?: number;
    score?: number;
    status: ReviewerStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FilterReviewersOptions {
    targetType?: ReviewerTargetType;
    reviewer?: string | User;
    application?: string | Application;
    verification?: string | Verification;
    status?: ReviewerStatus;
}

export const validateReviewer = (reviewer: Reviewer): { valid: boolean; message?: string } => {
    if (!reviewer.targetType) {
        return { valid: false, message: 'Target type is required.' };
    }
    if (!reviewer.reviewer) {
        return { valid: false, message: 'Reviewer is required.' };
    }
    if (reviewer.targetType === ReviewerTargetType.APPLICATION && !reviewer.application) {
        return { valid: false, message: 'Application is required when target type is APPLICATION.' };
    }
    if (reviewer.targetType === ReviewerTargetType.VERIFICATION && !reviewer.verification) {
        return { valid: false, message: 'Verification is required when target type is VERIFICATION.' };
    }
    return { valid: true };
};

export const sanitizeReviewer = (reviewer: Partial<Reviewer | FilterReviewersOptions>): Reviewer => {
    return {
        ...reviewer,
        application:
            typeof reviewer.application === "object" && reviewer.application !== null
                ? (reviewer.application as any)._id
                : reviewer.application,
        verification:
            typeof reviewer.verification === "object" && reviewer.verification !== null
                ? (reviewer.verification as any)._id
                : reviewer.verification,
        reviewer:
            typeof reviewer.reviewer === "object" && reviewer.reviewer !== null
                ? (reviewer.reviewer as User)._id
                : reviewer.reviewer
    } as Reviewer;
};