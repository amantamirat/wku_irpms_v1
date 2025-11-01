import mongoose from "mongoose";

export interface CreateStageDTO {
    call: mongoose.Types.ObjectId;
    name: string;
    type: string;
    evaluation: mongoose.Types.ObjectId;
    deadline?: Date;
}

export interface UpdateStageDTO {
    id: string;
    data: Partial<{
        name: string;
        type: string;
        evaluation: mongoose.Types.ObjectId;
        deadline: Date;
        status: string;
    }>;
}

export interface GetStagesDTO {
    call: mongoose.Types.ObjectId;
}
