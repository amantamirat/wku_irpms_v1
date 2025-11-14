import mongoose from "mongoose";

export interface DeleteDto {
    id: string | mongoose.Types.ObjectId;
    userId?: string;
}