import mongoose, { model, Schema } from "mongoose";
import { ReviewerStatus } from "./reviewer.enum";
import { COLLECTIONS } from "../../../enums/collections.enum";

interface IReviewer extends Document {
    projectStage: mongoose.Types.ObjectId;
    applicant: mongoose.Types.ObjectId;
    status: ReviewerStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ReviewerSchema = new Schema<IReviewer>({
    projectStage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT_STAGE,
        required: true
    },
    applicant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.APPLICANT,
        immutable: true,
        required: true
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