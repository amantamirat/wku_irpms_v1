import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { Project } from "../../models/project.model";

export enum DocStatus {
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
    status: DocStatus;
    createdAt?: Date;
    updatedAt?: Date;
}



export interface GetProjectStageOptions {
    project?: string | Project;
    stage?: string | Stage;
    //status?: string;
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


export const sanitizeProjectDoc = (ps: Partial<ProjectDoc>): Partial<ProjectDoc> => {
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

export interface UpdateStatusDTO {
    documents: string[] | ProjectDoc[];
    status: DocStatus;
}

export const sanitizeUpdateStatusDTO = (dto: Partial<UpdateStatusDTO>): Partial<UpdateStatusDTO> => {
    if (!dto.documents) {
        return dto as UpdateStatusDTO;
    }
    const documents = dto.documents.map((doc) =>
        typeof doc === "string" ? doc : doc._id ?? ''
    ).filter(Boolean);
    return {
        ...dto,
        documents,
    };
};




