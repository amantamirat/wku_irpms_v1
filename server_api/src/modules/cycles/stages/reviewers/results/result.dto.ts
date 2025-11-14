import mongoose from "mongoose";

export interface GetResultsDTO {
    reviewer?: mongoose.Types.ObjectId;
}

export interface CreateResultDTO {
    reviewer: mongoose.Types.ObjectId;
    criterion: mongoose.Types.ObjectId;
    score?: number;
    selected_option?: mongoose.Types.ObjectId;
    userId: string;
}

export interface UpdateResultDTO {
    id: string;
    data: Partial<{
        score: number;
        selected_option: mongoose.Types.ObjectId;
    }>;
    userId: string;
}
