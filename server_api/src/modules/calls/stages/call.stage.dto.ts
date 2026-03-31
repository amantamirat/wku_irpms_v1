import { CallStageStatus } from "./call.stage.model";

export interface CreateStageDTO {
    call: string;
    grantStage: string;
    order: number;
    deadline?: Date;
    status?: CallStageStatus;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        deadline: Date;
        status: CallStageStatus;
    }>;
}

export interface GetStageDTO {
    call?: string;
    order?: number;
    grantStage?: string;
    status?: CallStageStatus;
    populate?: boolean;
}

export interface ExistsStageDTO {
    grantStage?: string;
    call?: string;
}



