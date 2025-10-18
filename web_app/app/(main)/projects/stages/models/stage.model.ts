import { Evaluation } from "../../../evals/models/evaluation.model";
import { Project } from "../../models/project.model";

export enum StageStatus {
    pending = 'pending',
    submitted = 'submitted',
    accepted = 'accepted'
}

export type ProjectStage = {
    _id?: string;
    project: string | Project;
    stage: string | Evaluation;
    documentPath?: string;
    file?: File;
    status: StageStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateProjectStage = (ps: ProjectStage): { valid: boolean; message?: string } => {
    if (!ps.stage) {
        return { valid: false, message: "Stage is required." };
    }
    if (!ps.file && !ps._id) {
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
        stage:
            typeof ps.stage === "object" && ps.stage !== null
                ? (ps.stage as Evaluation)._id
                : ps.stage,
    };
}