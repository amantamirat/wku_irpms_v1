import mongoose from "mongoose";
import {
    PhaseActivityStatus,
    PhaseActivityType,
    PhaseActivityDetails,
    IPhaseActivityDetailCost,
} from "./phase-activity.model";

export interface PhaseActivityDto {
    title: string;
    description?: string;

    cost: number;
    detailCost?: IPhaseActivityDetailCost;

    startDate: Date | null;
    endDate: Date | null;

    status?: PhaseActivityStatus;
}

// `kind` + `details` come from the discriminated union, so
// { kind: MEETING, details: { method: "SURVEY" } } is a compile error.
export type CreatePhaseActivityDto =
    PhaseActivityDto &
    PhaseActivityDetails & {
        project: string;
        phase?: string;
    };

// Partial of any details shape. Partial<> distributes over the union.
export type PhaseActivityDetailsPatch = Partial<PhaseActivityDetails["details"]>;

export interface UpdatePhaseActivityDto {
    data: {
        phase?: string;
        title?: string;
        description?: string;

        cost?: number;
        detailCost?: IPhaseActivityDetailCost;

        startDate?: Date;
        endDate?: Date;

        // If `kind` changes, send a full matching `details` in the same request.
        // If `kind` is unchanged, `details` is merged into the existing details.
        kind?: PhaseActivityType;
        details?: PhaseActivityDetailsPatch;
    };
}

export interface FilterPhaseActivities {
    project?: string | mongoose.Types.ObjectId;
    phase?: string | mongoose.Types.ObjectId;
    status?: PhaseActivityStatus;
    kind?: PhaseActivityType;
}