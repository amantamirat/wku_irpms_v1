import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { ProjectStage } from "../../stages/models/stage.model";


export enum ReviewerStatus {
    pending = 'pending',
    active = 'active',
    submitted = 'submitted',
    approved = 'approved'
}

export type Reviewer = {
    _id?: string;
    projectStage?: string | ProjectStage;
    applicant?: string | Applicant;
    status?: ReviewerStatus;
    createdAt?: Date;
    updatedAt?: Date;
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
                ? (reviewer.projectStage as ProjectStage)._id
                : reviewer.projectStage,
        applicant:
            typeof reviewer.applicant === "object" && reviewer.applicant !== null
                ? (reviewer.applicant as Applicant)._id
                : reviewer.applicant,
    } as Reviewer;
};
