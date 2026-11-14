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


export type CreatePhaseActivityDto = PhaseActivityDto &
    PhaseActivityDetails & {
        phase: string;
    };

export type UpdatePhaseActivityDto = Partial<
    Omit<CreatePhaseActivityDto, "project">
>;

export interface FilterPhaseActivities {
    project?: string | mongoose.Types.ObjectId;
    phase?: string | mongoose.Types.ObjectId;
    status?: PhaseActivityStatus;
    kind?: PhaseActivityType;
}