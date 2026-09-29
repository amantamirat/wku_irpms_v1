import { PhaseActivityStatus } from "./phase-activity.model";

export interface CreatePhaseActivityDto {
    phase: string;

    title: string;
    description?: string;

    participants?: number;
    //requiredDays?: number;

    cost: number;

    status?: PhaseActivityStatus;

    startDate?: Date;
    endDate?: Date;
}

export interface UpdatePhaseActivityDto {
    data: {
        title?: string;
        description?: string;

        participants?: number;
        //requiredDays?: number;

        cost?: number;

        startDate?: Date;
        endDate?: Date;
    };
}

export interface FilterPhaseActivities {
    phase?: string;
    status?: PhaseActivityStatus;
}