import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { Project } from "../../projects/models/project.model";

export enum ApplicationStatus {
    pending = 'pending',
    accepted = 'accepted',
    rejected = 'rejected'
}

export type Application = {
    _id?: string;
    project: string | Project;
    stage?: string | Stage;
    documentPath?: string;
    file?: File;
    totalScore?: number | null;
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


export const sanitizeProjectApplication = (ps: Partial<Application>): Partial<Application> => {
    return {
        ...ps,
        project:
            typeof ps.project === "object" && ps.project !== null
                ? (ps.project as Project)._id
                : ps.project,
        stage:
            typeof ps.stage === "object" && ps.stage !== null
                ? (ps.stage as any)._id
                : ps.stage,
    };
}

/**
 * Create empty project stage
 */
export const createEmptyApplication = (
    stage?: Partial<Application>
): Application => ({
    project: stage?.project ?? "",
    stage: stage?.stage ?? "",
    status: stage?.status ?? ApplicationStatus.pending,
});







