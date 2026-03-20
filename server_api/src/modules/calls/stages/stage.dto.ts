import { StageStatus } from "./stage.status";

export interface FindStageDTO {
    call: string;
    order: number;
}

export interface GetStageDTO {
    call?: string;
    grantStage?: string;
    status?: StageStatus;
    populate?: boolean;
}

export interface CreateStageDTO {
    call: string;
    grantStage: string;
    deadline?: Date;
    status?: StageStatus.planned;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        deadline: Date;
        status: StageStatus;
    }>;
}

export interface ExistsStageDTO {
    grantStage?: string;
    call?: string;
}



