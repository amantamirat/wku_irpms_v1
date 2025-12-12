import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";
import { Call } from "../../models/call.model";

export enum StageStatus {
    planned = "planned",
    active = "active",
    closed = "closed",
}

export type Stage = {
    _id?: string;
    call: string | Call;
    name: string;
    evaluation: string | Evaluation;
    deadline?: Date;
    status: StageStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetStagesDTO {
    call?: string | Call;
}

/**
 * Validate stage fields before submission
 */
export const validateStage = (stage: Stage): { valid: boolean; message?: string } => {
    if (!stage.name || stage.name.trim().length === 0) {
        return { valid: false, message: "Stage name is required." };
    }

    if (!stage.call) {
        return { valid: false, message: "Call reference is required." };
    }

    if (!stage.evaluation) {
        return { valid: false, message: "Evaluation reference is required." };
    }

    if (stage.deadline) {
        const deadlineDate = new Date(stage.deadline);
        if (isNaN(deadlineDate.getTime())) {
            return { valid: false, message: "Deadline must be a valid date." };
        }
    }

    if (!stage.status) {
        return { valid: false, message: "Stage status is required." };
    }

    return { valid: true };
};

/**
 * Prepare stage object for backend submission
 */
export const sanitizeStage = (stage: Partial<Stage>): Partial<Stage> => {
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
