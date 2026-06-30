import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { Project } from "../../models/project.model";

export enum ApplicationStatus {
    submitted = 'submitted',
    accepted = 'accepted',
    rejected = 'rejected'
}

export type ProjectApplication = {
    _id?: string;
    project: string | Project;
    grantStage?: string | GrantStage;
    documentPath?: string;
    file?: File;
    totalScore?: number | null;
    status: ApplicationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}



export interface GetProjectApplicationOptions {
    project?: string | Project;
    grantStage?: string | GrantStage;
   // callStage?: string | CallStage;
    //grantAllocation?: string;
    status?: ApplicationStatus;
    populate?: boolean;
}

export const validateProjectApplication = (ps: Partial<ProjectApplication>): { valid: boolean; message?: string } => {
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


export const sanitizeProjectApplication = (ps: Partial<ProjectApplication>): Partial<ProjectApplication> => {
    return {
        ...ps,
        project:
            typeof ps.project === "object" && ps.project !== null
                ? (ps.project as Project)._id
                : ps.project,
        grantStage:
            typeof ps.grantStage === "object" && ps.grantStage !== null
                ? (ps.grantStage as any)._id
                : ps.grantStage,
    };
}

/**
 * Create empty project stage
 */
export const createEmptyProjectApplication = (
    stage?: Partial<ProjectApplication>
): ProjectApplication => ({
    project: stage?.project ?? "",
    grantStage: stage?.grantStage ?? "",
    status: stage?.status ?? ApplicationStatus.submitted,
});







