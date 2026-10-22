import { CallStatus, ICall } from "./call.model";
import { IStage } from "./stages/stage.model";

export interface CallOpportunityDTO {
    call: ICall;
    activeStage: IStage;
}

export interface CreateCallDTO {
    grant: string;
    organization?: string;
    calendar: string;
    title: string;
    constraint?: string;
    composition?: string;
    description?: string;
    //stages?: CreateStageDTO[];
    //status?: CallStatus;
}

/*
export interface CreateCallWithStagesDto {
    call: {
        calendar: string;
        grant: string;
        title: string;
        constraint?: string | null;
        composition?: string | null;
        description?: string;
    };
    stages: Array<{
        name: string;
        deadline: Date | string;
        evaluation: string;
        minAcceptanceScore: number;
        minReviewers: number;
        maxReviewers: number;
        template?: string | null;
        constraint?: string | null;
    }>;
}
*/
// Base fields for updating any call
export interface UpdateCallDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
        budget: number;
        constraint: string;
        composition: string;
       // deadline: Date | null;
    }>;
}

export interface FilterCallDTO {
    calendar?: string;
    grant?: string;
    status?: CallStatus;
}

