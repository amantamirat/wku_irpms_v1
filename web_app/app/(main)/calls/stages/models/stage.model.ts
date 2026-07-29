import { Call } from "@/app/(main)/calls/models/call.model";
import { CallStageStatus } from "./stage.state-machine";
import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";
import { Template } from "@/app/(main)/templates/models/template.model";


export type Stage = {
    _id?: string;
    call?: string | Call;
    name?: string;
    order: number;
    deadline: Date;

    template?: string | Template;

    evaluation?: string | Evaluation;
    minReviewers?: number;
    maxReviewers?: number;
    minAcceptanceScore?: number;

    status?: CallStageStatus;
    createdAt?: Date;
    updatedAt?: Date;
};


export interface GetStagesDTO {
    call?: string | Call;
    name?: string;
    order?: number;
    status?: CallStageStatus;
    populate?: boolean;
}


/**
 * Validate call stage fields before submission
 */
export const validateCallStage = (
    stage: Stage
): { valid: boolean; message?: string } => {

    if (!stage.call) {
        return { valid: false, message: "Call reference is required." };
    }

    if (!stage.name) {
        return { valid: false, message: "Stage name is required." };
    }

    if (!stage.deadline) {
        return { valid: false, message: "Deadline is required." };
    }

    return { valid: true };
};


/**
 * Prepare call stage object for backend submission
 */
export const sanitizeCallStage = (
    stage: Partial<Stage>
): Partial<Stage> => {

    return {
        ...stage,

        call:
            typeof stage.call === "object" && stage.call !== null
                ? (stage.call as Call)._id
                : stage.call,

        evaluation:
            typeof stage.evaluation === "object" && stage.evaluation !== null
                ? (stage.evaluation as Evaluation)._id
                : stage.evaluation,

        template:
            typeof stage.template === "object" && stage.template !== null
                ? (stage.template as Template)._id
                : stage.template,
    };
};


/**
 * Create empty call stage
 */
export const createEmptyCallStage = (
    stage?: Partial<Stage>
): Stage => ({
    call: stage?.call ?? "",
    name: stage?.name ?? "",
    order: stage?.order ?? 1,
    deadline: stage?.deadline ?? new Date(),

    template: stage?.template ?? "",

    evaluation: stage?.evaluation ?? "",

    minReviewers: stage?.minReviewers ?? 1,
    maxReviewers: stage?.maxReviewers ?? 3,
    minAcceptanceScore: stage?.minAcceptanceScore ?? 50,
});