import mongoose from "mongoose";

export interface CreateOptionDTO {
    criterion: mongoose.Types.ObjectId;
    title: string;
    score: number;
}

export interface UpdateOptionDTO {
    id: string;
    updates: Partial<{
        title: string;
        score: number;
    }>;
}

export interface DeleteOptionDTO {
    id: string;
}

export interface GetOptionsDTO {
    criterion: mongoose.Types.ObjectId;
}
