import mongoose from "mongoose";
import { PhaseActivityStatus, IPhaseActivityDetailCost } from "./phase-activity.model";

export interface CreatePhaseActivityDto {
    phase: string;

    title: string;
    description?: string;

    cost: number;
    detailCost?: IPhaseActivityDetailCost;

    startDate: Date;
    endDate: Date;

    status?: PhaseActivityStatus;
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