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
    component?: string;
}

export interface UpdatePhaseActivityDto {
    data: {
        title?: string;
        description?: string;

        cost?: number;
        detailCost?: IPhaseActivityDetailCost;

        startDate?: Date;
        endDate?: Date;
        component?: string | null;
    };
}

export interface FilterPhaseActivities {
    phase?: string | mongoose.Types.ObjectId;
    phases?: Array<string | mongoose.Types.ObjectId>;
    status?: PhaseActivityStatus;
    component?: string | mongoose.Types.ObjectId;
}