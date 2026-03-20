import { Call } from "@/app/(main)/calls/models/call.model";
import { StageStatus } from "./stage.state-machine";
import { Stage } from "@/app/(main)/grants/stages/models/stage.model";

export type CallStage = {
    _id?: string;
    call: string | Call;
    grantStage?: string | Stage;
    deadline: Date;
    status: StageStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetCallStagesDTO {
    call?: string | Call;
    grantStage?: string | Stage;
    populate?: boolean;
}

/**
 * Validate call stage fields before submission
 */
export const validateCallStage = (
    stage: CallStage
): { valid: boolean; message?: string } => {

    if (!stage.call) {
        return { valid: false, message: "Call reference is required." };
    }

    if (!stage.grantStage) {
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
    stage: Partial<CallStage>
): Partial<CallStage> => {
    return {
        ...stage,
        call:
            typeof stage.call === "object" && stage.call !== null
                ? (stage.call as Call)._id
                : stage.call,
        grantStage:
            typeof stage.grantStage === "object" && stage.grantStage !== null
                ? (stage.grantStage as Stage)._id
                : stage.grantStage,
    };
};

/**
 * Create empty call stage
 */
export const createEmptyCallStage = (
    stage?: Partial<CallStage>
): CallStage => ({
    call: stage?.call ?? "",
    grantStage: stage?.grantStage ?? "",
    deadline: stage?.deadline ?? new Date(),
    status: stage?.status ?? StageStatus.planned,
});