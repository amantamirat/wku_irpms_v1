//project-stage.ts
import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum ApplicationStatus {
    submitted = 'submitted',
    accepted = 'accepted',
    rejected = 'rejected'
}

export interface IProjectApplication extends Document {
    _id: mongoose.Types.ObjectId;
    grantStage: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    documentPath: string;
    totalScore: number | null;
    status: ApplicationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjecApplicationSchema = new Schema<IProjectApplication>({
    grantStage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.GRANT_STAGE,
        immutable: true,
        required: true
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
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

ProjecApplicationSchema.index({ project: 1, grantStage: 1 }, { unique: true });

export const ProjectApplication = model<IProjectApplication>(COLLECTIONS.PROJECT_APPLICATION, ProjecApplicationSchema);

