import mongoose from "mongoose";
import { ReviewerStatus } from "./reviewer.enum";

export interface GetReviewerOptions {
    projectStage?: mongoose.Types.ObjectId;
    applicant?: mongoose.Types.ObjectId;
}

export interface CreateReviewerDto {
    projectStage: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
}

export interface UpdateReviewerDto {
    id: string;
    data: Partial<{
        status: ReviewerStatus;
    }>;
    userId: string;
}