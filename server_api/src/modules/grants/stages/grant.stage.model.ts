import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum DecisionMode {
    MANUAL = "MANUAL",
    AUTOMATIC = "AUTOMATIC",
}

export interface IGrantStage extends Document {
    _id: string;
    grant: mongoose.Types.ObjectId;
    name: string;
    order: number;
    evaluation: mongoose.Types.ObjectId;

    minReviewers: number;
    maxReviewers: number;

    decisionMode: DecisionMode;
    minAcceptanceScore: number;

    createdAt?: Date;
    updatedAt?: Date;
}

const GrantStageSchema = new Schema<IGrantStage>(
    {
        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
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
            min: 1,
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

        // NEW: decision handling mode
        decisionMode: {
            type: String,
            enum: Object.values(DecisionMode),
            default: DecisionMode.MANUAL,
        },

        minAcceptanceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 50,
            required: true
        },
    },
    { timestamps: true }
);

GrantStageSchema.index({ grant: 1, order: 1 }, { unique: true });
GrantStageSchema.index({ grant: 1, name: 1 }, { unique: true });

export const GrantStage = model<IGrantStage>(
    COLLECTIONS.GRANT_STAGE,
    GrantStageSchema
);