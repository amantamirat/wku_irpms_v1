import { StageStatus } from "./stage.status";

export interface FindStageDTO {
    call: string;
    order: number;
}

export interface GetStageDTO {
    call?: string;
    status?: StageStatus;
    populate?: boolean;
}

export interface CreateStageDTO {
    call: string;
    name: string;
    order?: number;
    evaluation: string;
    deadline?: Date;
    status?: StageStatus.planned;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        name: string;
        evaluation: string;
        deadline: Date;
        //isFinal: boolean;
        status: StageStatus;
    }>;
}

export interface UpdateStageStatusDTO {
    id: string;
    status: StageStatus;
}



