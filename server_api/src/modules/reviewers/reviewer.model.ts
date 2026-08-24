//reviewer.model.ts
import mongoose, { model, Schema } from "mongoose";
import { ReviewerStatus } from "./reviewer.state-machine";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export enum ReviewerTargetType {
    APPLICATION = 'APPLICATION',
    VERIFICATION = 'VERIFICATION'
}

export interface IReviewer extends Document {
    targetType: ReviewerTargetType;
    reviewer: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    application?: mongoose.Types.ObjectId;
    verification?: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId;
    score?: number;
    weight?: number;
    status: ReviewerStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ReviewerSchema = new Schema<IReviewer>({
    targetType: {
        type: String,
        enum: Object.values(ReviewerTargetType),
        required: true,
        immutable: true
    },

    reviewer: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
        required: true,
        immutable: true
    },

    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
        required: true,
        immutable: true
    },

    application: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.APPLICATION,
        immutable: true,
        sparse: true
    },

    verification: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.VERIFICATION,
        immutable: true,
        sparse: true
    },
    evaluation: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.EVALUATION,
        immutable: true,
        sparse: true
    },
    score: {
        type: Number,
        min: 0
    },

    weight: {
        type: Number,
        min: 1,
        default: 1
    },

    status: {
        type: String,
        enum: Object.values(ReviewerStatus),
        default: ReviewerStatus.pending,
        required: true
    }

}, { timestamps: true });

ReviewerSchema.index(
    {
        application: 1,
        reviewer: 1
    },
    {
        unique: true,
        sparse: true
    }
);

ReviewerSchema.index(
    {
        verification: 1,
        reviewer: 1
    },
    {
        unique: true,
        sparse: true
    }
);
export const Reviewer = model<IReviewer>(COLLECTIONS.REVIEWER, ReviewerSchema);