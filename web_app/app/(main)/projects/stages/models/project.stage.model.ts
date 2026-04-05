import { CallStage } from "@/app/(main)/calls/stages/models/call.stage.model";
import { Project } from "../../models/project.model";
import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { GrantAllocation } from "@/app/(main)/grants/allocations/models/grant.allocation.model";

export enum ProjectStageStatus {
    submitted = 'submitted',
    selected = 'selected',
    //under_review = 'under_review',
    reviewed = 'reviewed',
    accepted = 'accepted',
    rejected = 'rejected'
}

export type ProjectStage = {
    _id?: string;
    project: string | Project;
    grantStage?: string | GrantStage;
    callStage?: string | CallStage;
    documentPath?: string;
    file?: File;
    totalScore?: number | null;
    status: ProjectStageStatus;
    createdAt?: Date;
    updatedAt?: Date;
}



export interface GetProjectStageOptions {
    project?: string | Project;
    grantStage?: string | GrantStage;
    callStage?: string | CallStage;
    grantAllocation?: string;
    status?: ProjectStageStatus;
    populate?: boolean;
}

export const validateProjectStage = (ps: Partial<ProjectStage>): { valid: boolean; message?: string } => {
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


export const sanitizeProjectStage = (ps: Partial<ProjectStage>): Partial<ProjectStage> => {
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
export const createEmptyProjectStage = (
    stage?: Partial<ProjectStage>
): ProjectStage => ({
    project: stage?.project ?? "",
    status: stage?.status ?? ProjectStageStatus.submitted,
});







