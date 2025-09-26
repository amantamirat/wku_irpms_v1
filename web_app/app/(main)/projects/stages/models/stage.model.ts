import { Evaluation } from "../../../evals/models/eval.model";
import { Project } from "../../models/project.model";

export type ProjectStage = {
    _id?: string;
    project?: string | Project;
    stage?: string | Evaluation;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateProjectStage = (pt: ProjectStage): { valid: boolean; message?: string } => {
     return { valid: true };
}