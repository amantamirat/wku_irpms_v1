import { Evaluation } from "../../../evals/models/eval.model";
import { Project } from "../../models/project.model";

export type ProjectStage = {
    _id?: string;
    project: string | Project;
    stage: string | Evaluation;
    documentPath?: string;
    file?: File;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateProjectStage = (pt: ProjectStage): { valid: boolean; message?: string } => {
    if (!pt.stage) {
        return { valid: false, message: "Stage is required." };
    }
    if (!pt.file) {
        return { valid: false, message: "Document (PDF) file is required." };
    }
    return { valid: true };
}