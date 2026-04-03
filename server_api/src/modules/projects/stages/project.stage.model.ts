//project-stage.ts
import mongoose, { model, Schema } from "mongoose";
import { ProjectStageStatus } from "./project.stage.status";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export interface IProjectStage extends Document {
    _id: mongoose.Types.ObjectId;
    grantStage: mongoose.Types.ObjectId;
    callStage?: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    documentPath: string;
    totalScore?: number;
    status: ProjectStageStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjecStageSchema = new Schema<IProjectStage>({
    grantStage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.GRANT_STAGE,
        immutable: true,
        required: true
    },
    callStage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL_STAGE,
        immutable: true,
        //required: true
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
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(ProjectStageStatus),
        default: ProjectStageStatus.submitted,
        required: true
    },
}, { timestamps: true });

ProjecStageSchema.index({ project: 1, grantStage: 1 }, { unique: true });
export const ProjectStage = model<IProjectStage>(COLLECTIONS.PROJECT_STAGE, ProjecStageSchema);