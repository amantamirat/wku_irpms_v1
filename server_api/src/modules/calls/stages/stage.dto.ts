import { StageStatus, StageType } from "./stage.enum";

export interface GetStagesDTO {
    cycle?: string;
    type?: StageType;
    order?: number;
    status?: StageStatus;
}

export interface CreateStageDTO {
    cycle: string;
    name: string;
    type: StageType;
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


