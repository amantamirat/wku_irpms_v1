import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { Project } from "../../projects/models/project.model";
import { User } from "../../users/models/user.model";

export enum ApplicationStatus {
    submitted = "submitted",
    shortlisted = "shortlisted",
    notShortlisted = "notShortlisted",
    accepted = "accepted",
    rejected = "rejected"
}

export enum AnonymizationStatus {
    pending = "pending",
    processing = "processing",
    completed = "completed",
    manualReview = "manualReview",
    failed = "failed"
}

export type Application = {
    _id?: string;
    project: string | Project;
    stage?: string | Stage;
    documentPath?: string;
    file?: File;
    totalScore?: number | null;
    anonymizationStatus: AnonymizationStatus;
    anonymizedDocumentPath?: string;
    reviewerAssigner?: string | User | null;
    status: ApplicationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}



export interface FilterApplicationOptions {
    reviewerAssigner?: string | User;
    project?: string | Project;
    stage?: string | Stage;
    status?: ApplicationStatus;
    //populate?: boolean;
}

export const validateApplication = (ps: Partial<Application>): { valid: boolean; message?: string } => {
    if (!ps.project) {
        return { valid: false, message: "Project is required." };
    }
    /*
    if (!ps.grantStage) {
        return { valid: false, message: "Stage is required." };
    }
    */
    if (!ps.file) {
        return { valid: false, message: "Document (PDF) file is required." };
    }
    return { valid: true };
}


/**
 * Create empty project stage
 */
export const createEmptyApplication = (
    app?: Partial<Application>
): Application => ({
    project: app?.project ?? "",
    stage: app?.stage ?? "",
    status: app?.status ?? ApplicationStatus.submitted,
    anonymizationStatus: app?.anonymizationStatus ?? AnonymizationStatus.pending
});







