import { Call } from "@/app/(main)/calls/models/call.model";

import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";
import { Template } from "@/app/(main)/templates/models/template.model";

export enum StageStatus {
    upcoming= 'upcoming',
    active = 'active',
    closed = "closed"
}

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

    status?: StageStatus;
    createdAt?: Date;
    updatedAt?: Date;
};


export interface FilterStagesDTO {
    call?: string | Call;
    name?: string;
    order?: number;
    status?: StageStatus;
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


