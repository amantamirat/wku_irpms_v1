import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { Project } from "../../models/project.model";

export enum ProjectDocStatus {
    pending = 'pending',
    submitted = 'submitted',
    on_review = 'on_review',
    reviewed = 'reviewed',
    accepted = 'accepted',
    rejected = 'rejected'
}

export type ProjectDoc = {
    _id?: string;
    project: string | Project;
    stage?: string | Stage;
    documentPath?: string;
    file?: File;
    totalScore?: number;
    status: ProjectDocStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateProjectDoc = (ps: ProjectDoc): { valid: boolean; message?: string } => {
    if (!ps.stage) {
        return { valid: false, message: "Stage is required." };
    }
    if (!ps.file && !ps._id) {
        return { valid: false, message: "Document (PDF) file is required." };
    }
    return { valid: true };
}


export const sanitizeProjectStage = (ps: Partial<ProjectDoc>): Partial<ProjectDoc> => {
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

export interface GetProjectStageOptions {
    project?: string | Project;
    stage?: string | Stage;
    //status?: string;
}