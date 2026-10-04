import mongoose from "mongoose";
import { PhaseActivityStatus, IPhaseActivityDetailCost } from "./phase-activity.model";

export interface PhaseActivityDto {

    title: string;
    description?: string;

    cost: number;
    detailCost?: IPhaseActivityDetailCost;

    startDate: Date | null;
    endDate: Date | null;

    status?: PhaseActivityStatus;
}

export interface CreatePhaseActivityDto extends PhaseActivityDto {
    phase: string;
}

export interface UpdatePhaseActivityDto {
    data: {
        title?: string;
        description?: string;

        cost?: number;
        detailCost?: IPhaseActivityDetailCost;

        startDate?: Date;
        endDate?: Date;
    };
}

export interface FilterPhaseActivities {
    phase?: string | mongoose.Types.ObjectId;
    status?: PhaseActivityStatus;
}