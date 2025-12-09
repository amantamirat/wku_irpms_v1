import mongoose from "mongoose";

export interface CreateEvaluationDTO {
    directorate: mongoose.Types.ObjectId;
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

export interface GetEvaluationsDTO {
    directorate?: string;
}
