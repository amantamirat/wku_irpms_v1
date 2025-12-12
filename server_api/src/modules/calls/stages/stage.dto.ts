import { StageStatus } from "./stage.enum";

export interface GetStagesDTO {
    call?: string;
    //type?: StageType;
    order?: number;
    status?: StageStatus;
}

export interface CreateStageDTO {
    call: string;
    name: string;
    order?:number;
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
        status: StageStatus;
    }>;
}


