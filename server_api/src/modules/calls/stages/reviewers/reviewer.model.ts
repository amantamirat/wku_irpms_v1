//reviewer.model.ts
import mongoose, { model, Schema } from "mongoose";
import { ReviewerStatus } from "./reviewer.status";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export interface IReviewer extends Document {
    projectStage: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    score?: number;
    weight?: number;
    status: ReviewerStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ReviewerSchema = new Schema<IReviewer>({
    projectStage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT_DOCUMENT,
        required: true,
        immutable: true,
    },
    applicant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.APPLICANT,
        immutable: true,
        required: true
    },
    score: {
        type: Number,
        min: 0
    },
    weight: {
        type: Number,
        min: 0,
        default: 1
    },
    status: {
        type: String,
        enum: Object.values(ReviewerStatus),
        default: ReviewerStatus.pending,
        required: true
    },
}, { timestamps: true });

ReviewerSchema.index({ projectStage: 1, applicant: 1 }, { unique: true });
export const Reviewer = model<IReviewer>(COLLECTIONS.REVIEWER, ReviewerSchema);