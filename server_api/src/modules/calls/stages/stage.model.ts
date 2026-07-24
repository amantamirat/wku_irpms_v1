import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum StageStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}
export interface IStage extends Document {
    _id: string;
    call: mongoose.Types.ObjectId;
    name: string;
    order: number;
    evaluation: mongoose.Types.ObjectId;

    minReviewers: number;
    maxReviewers: number;
    minAcceptanceScore: number;
    deadline: Date;
    status: StageStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const StageSchema = new Schema<IStage>(
    {
        call: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.CALL,
            required: true,
            immutable: true,
        },
        name: {
            type: String,
            required: true,
        },
        order: {
            type: Number,
            required: true,
            min: 0, //verification
            max: 5,
        },
        evaluation: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.EVALUATION,
            required: true,
            immutable: true,
        },
        minReviewers: {
            type: Number,
            required: true,
            min: 0,
            max: 10,
            default: 1,
        },
        maxReviewers: {
            type: Number,
            required: true,
            min: 0,
            max: 10,
            default: 3,
        },
        minAcceptanceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 50,
            required: true
        },
        deadline: { type: Date, required: true },
        status: { type: String, enum: Object.values(StageStatus), default: StageStatus.planned, required: true },
    },
    { timestamps: true }
);

StageSchema.index({ call: 1, order: 1 }, { unique: true });
StageSchema.index({ call: 1, name: 1 }, { unique: true });

export const Stage = model<IStage>(
    COLLECTIONS.STAGE,
    StageSchema
);