//project-stage.ts
import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum ApplicationStatus {
    submitted = 'submitted',
    accepted = 'accepted',
    rejected = 'rejected'
}

export interface IApplication extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    stage: mongoose.Types.ObjectId;
    documentPath: string;
    totalScore: number | null;
    status: ApplicationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ApplicationSchema = new Schema<IApplication>({
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
    totalScore: {
        type: Number,
        min: 0,
        default: null
    },
    status: {
        type: String,
        enum: Object.values(ApplicationStatus),
        default: ApplicationStatus.submitted,
        required: true
    },
}, { timestamps: true });

ApplicationSchema.index({ project: 1, stage: 1 }, { unique: true });
export const Application = model<IApplication>(COLLECTIONS.APPLICATION, ApplicationSchema);

