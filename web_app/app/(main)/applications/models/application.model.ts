import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { Project } from "../../projects/models/project.model";

export enum ApplicationStatus {
    pending = 'pending',
    accepted = 'accepted',
    rejected = 'rejected'
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
    status: ApplicationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}



export interface GetProjectApplicationOptions {
    project?: string | Project;
    stage?: string | Stage;
    status?: ApplicationStatus;
    //populate?: boolean;
}

export const validateProjectApplication = (ps: Partial<Application>): { valid: boolean; message?: string } => {
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


export const sanitizeApplication = (app: Partial<Application>): Partial<Application> => {
    return {
        ...app,
        project:
            typeof app.project === "object" && app.project !== null
                ? (app.project as Project)._id
                : app.project,
        stage:
            typeof app.stage === "object" && app.stage !== null
                ? (app.stage as any)._id
                : app.stage,
    };
}

/**
 * Create empty project stage
 */
export const createEmptyApplication = (
    app?: Partial<Application>
): Application => ({
    project: app?.project ?? "",
    stage: app?.stage ?? "",
    status: app?.status ?? ApplicationStatus.pending,
    anonymizationStatus: app?.anonymizationStatus ?? AnonymizationStatus.pending
});







