import mongoose from "mongoose";

export interface CreateEvaluationDTO {
    directorateId: mongoose.Types.ObjectId;
    title: string;
    userId: string;
}

export interface UpdateEvaluationDTO {
    id: string;
    data: {
        title?: string;
    };
    userId: string;
}
