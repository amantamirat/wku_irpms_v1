import mongoose from "mongoose";
import { StageStatus, StageType } from "./stage.enum";

export interface GetStagesDTO {
    cycle?: mongoose.Types.ObjectId;
    order?: number;
    status?: StageStatus;
}

export interface CreateStageDTO {
    cycle: mongoose.Types.ObjectId;
    name: string;
    type: StageType;
    evaluation: mongoose.Types.ObjectId;
    deadline?: Date;
    //status: StageStatus.planned;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        name: string;
        evaluation: mongoose.Types.ObjectId;
        deadline: Date;
        status: StageStatus;
    }>;
}


