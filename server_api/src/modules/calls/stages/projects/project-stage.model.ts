//project-stage.ts
import mongoose, { model, Schema } from "mongoose";
import { ProjectStageStatus } from "./project-stage.enum";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export interface IProjectStage extends Document {
    stage: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    status: ProjectStageStatus;
    documentPath: string;
    totalScore?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectStageSchema = new Schema<IProjectStage>({
    stage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.STAGE,
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
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(ProjectStageStatus),
        default: ProjectStageStatus.pending,
        required: true
    },
}, { timestamps: true });

ProjectStageSchema.index({ project: 1, stage: 1 }, { unique: true });
export const ProjectStage = model<IProjectStage>(COLLECTIONS.PROJECT_STAGE, ProjectStageSchema);