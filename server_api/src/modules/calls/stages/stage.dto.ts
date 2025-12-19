import { StageStatus } from "./stage.enum";

export interface FilterStageDTO {
    _id?: string;
    call?: string;
    order?: number;
    status?: StageStatus;
    isFinal?: boolean;
}

export interface CreateStageDTO {
    call: string;
    name: string;
    order?: number;
    evaluation: string;
    deadline?: Date;
    isFinal?: boolean;
    status?: StageStatus.planned;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        name: string;
        evaluation: string;
        deadline: Date;
        isFinal: boolean;
        status: StageStatus;
    }>;
}



