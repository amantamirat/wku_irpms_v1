import mongoose from "mongoose";

export interface CreateOptionDTO {
    criterionId: mongoose.Types.ObjectId;
    title: string;
    value: number;
}

export interface UpdateOptionDTO {
    id: string;
    updates: Partial<{
        title: string;
        value: number;
    }>;
}

export interface DeleteOptionDTO {
    id: string;
}

export interface GetOptionsDTO {
    criterionId: mongoose.Types.ObjectId;
}
