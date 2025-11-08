import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";
import { Cycle } from "../../models/cycle.model";


export enum StageStatus {
    planned = "planned",
    active = "active",
    closed = "closed",
}

export enum StageType {
    //screening = "screening",
    evaluation = "evaluation",
    validation = 'validation'
}

export type Stage = {
    _id?: string;
    cycle: string | Cycle;
    name: string;
    type: StageType;
    evaluation: string | Evaluation;
    deadline?: Date;
    status: StageStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

/**
 * Validate stage fields before submission
 */
export const validateStage = (stage: Stage): { valid: boolean; message?: string } => {
    if (!stage.name || stage.name.trim().length === 0) {
        return { valid: false, message: "Stage name is required." };
    }

    if (!stage.cycle) {
        return { valid: false, message: "Cycle reference is required." };
    }

    if (!stage.evaluation) {
        return { valid: false, message: "Evaluation reference is required." };
    }

    if (!stage.type) {
        return { valid: false, message: "Stage type is required." };
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
        cycle:
            typeof stage.cycle === "object" && stage.cycle !== null
                ? (stage.cycle as Cycle)._id
                : stage.cycle,
        evaluation:
            typeof stage.evaluation === "object" && stage.evaluation !== null
                ? (stage.evaluation as Evaluation)._id
                : stage.evaluation,
    };
};
