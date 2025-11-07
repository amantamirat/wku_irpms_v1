import mongoose from "mongoose";
import { StageStatus, StageType } from "./stage.enum";

export interface GetStagesDTO {
    call?: mongoose.Types.ObjectId;
}

export interface CreateStageDTO {
    call: mongoose.Types.ObjectId;
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
        //type: string;
        evaluation: mongoose.Types.ObjectId;
        deadline: Date;
        status: StageStatus;
    }>;
}


