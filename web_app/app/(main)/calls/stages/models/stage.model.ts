import { Call } from "@/app/(main)/calls/models/call.model";
import { CallStageStatus } from "./stage.state-machine";
import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";

export type Stage = {
    _id?: string;
    call: string | Call;
    name?: string;
    order: number;
    deadline: Date;
    evaluation?: string | Evaluation;
    minReviewers?: number;
    maxReviewers?: number;
    minAcceptanceScore?: number;
    //verificationDeadline?: Date;
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
        return { valid: false, message: "Grant stage reference is required." };
    }

    if (!stage.deadline) {
        return { valid: false, message: "Deadline is required." };
    }

    if (!stage.status) {
        return { valid: false, message: "Status is required." };
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
    order: 1,
    deadline: stage?.deadline ?? new Date(),
    minReviewers: 1,
    maxReviewers: 3,
    minAcceptanceScore: 50,
    //status: stage?.status ?? CallStageStatus.planned,
});