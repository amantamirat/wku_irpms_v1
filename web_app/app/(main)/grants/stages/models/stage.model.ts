import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";
import { Grant } from "../../models/grant.model";

export type Stage = {
    _id?: string;
    grant: string | Grant;
    name: string;
    order?: number;
    evaluation?: string | Evaluation;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetStagesDTO {
    grant?: string | Grant;
    evaluation?: string | Evaluation;
    populate?:boolean;
}

/**
 * Validate stage fields before submission
 */
export const validateStage = (stage: Stage): { valid: boolean; message?: string } => {

    if (!stage.name || stage.name.trim().length === 0) {
        return { valid: false, message: "Stage name is required." };
    }

    if (!stage.grant) {
        return { valid: false, message: "Grant reference is required." };
    }

    if (!stage.evaluation) {
        return { valid: false, message: "Evaluation reference is required." };
    }

    return { valid: true };
};

/**
 * Prepare stage object for backend submission
 */
export const sanitize = (stage: Partial<Stage>): Partial<Stage> => {
    return {
        ...stage,
        grant:
            typeof stage.grant === "object" && stage.grant !== null
                ? (stage.grant as any)._id
                : stage.grant,
        evaluation:
            typeof stage.evaluation === "object" && stage.evaluation !== null
                ? (stage.evaluation as Evaluation)._id
                : stage.evaluation,
    };
};

export const createEmptyStage = (stage?: Partial<Stage>): Stage => ({
    grant: stage?.grant ?? "",
    name: "",
    evaluation: stage?.evaluation ?? "",
    order: 1
});
