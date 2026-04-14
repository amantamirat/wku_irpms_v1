import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";
import { Grant } from "../../models/grant.model";

export type GrantStage = {
    _id?: string;
    grant: string | Grant;
    name: string;
    order?: number;
    evaluation?: string | Evaluation;
    minReviewers?: number;
    maxReviewers?: number;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetStagesDTO {
    grant?: string | Grant;
    evaluation?: string | Evaluation;
    populate?: boolean;
}

/**
 * Validate stage fields before submission
 */
export const validateGrantStage = (stage: GrantStage): { valid: boolean; message?: string } => {

    if (!stage.name || stage.name.trim().length === 0) {
        return { valid: false, message: "Stage name is required." };
    }

    if (!stage.grant) {
        return { valid: false, message: "Grant reference is required." };
    }

    if (!stage.evaluation) {
        return { valid: false, message: "Evaluation reference is required." };
    }
    if (
        stage.minReviewers !== undefined &&
        stage.maxReviewers !== undefined &&
        stage.minReviewers > stage.maxReviewers
    ) {
        return {
            valid: false,
            message: "Minimum reviewers cannot be greater than maximum reviewers."
        };
    }
    return { valid: true };
};

/**
 * Prepare stage object for backend submission
 */
export const sanitize = (stage: Partial<GrantStage>): Partial<GrantStage> => {
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

export const createEmptyGrantStage = (stage?: Partial<GrantStage>): GrantStage => ({
    grant: stage?.grant ?? "",
    name: "",
    evaluation: stage?.evaluation ?? "",
    order: 1,
    minReviewers: 1,
    maxReviewers: 3
});
