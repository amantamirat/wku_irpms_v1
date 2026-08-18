// application.model.ts
import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum ApplicationStatus {
    pending = "pending",
    accepted = "accepted",
    rejected = "rejected"
}

export enum AnonymizationStatus {
    pending = "pending",
    processing = "processing",
    completed = "completed",
    manualReview = "manualReview",
    failed = "failed"
}

export interface IApplication extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    stage: mongoose.Types.ObjectId;

    documentPath: string;
    anonymizedDocumentPath?: string;

    totalScore: number | null;

    anonymizationStatus: AnonymizationStatus;
    status: ApplicationStatus;

    createdAt?: Date;
    updatedAt?: Date;
}

const ApplicationSchema = new Schema<IApplication>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PROJECT,
            immutable: true,
            required: true
        },

        stage: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.STAGE,
            immutable: true,
            required: true
        },

        documentPath: {
            type: String,
            required: true
        },

        anonymizedDocumentPath: {
            type: String,
            required: false
        },

        totalScore: {
            type: Number,
            min: 0,
            default: null
        },

        anonymizationStatus: {
            type: String,
            enum: Object.values(AnonymizationStatus),
            default: AnonymizationStatus.pending,
            required: true
        },

        status: {
            type: String,
            enum: Object.values(ApplicationStatus),
            default: ApplicationStatus.pending,
            required: true
        }

    },
    {
        timestamps: true
    }
);

ApplicationSchema.index(
    { project: 1, stage: 1 },
    { unique: true }
);

export const Application =
    model<IApplication>(
        COLLECTIONS.APPLICATION,
        ApplicationSchema
    );