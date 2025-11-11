import mongoose, { model, Schema } from "mongoose";
import { ProjectStageStatus } from "./project.stage.enum";
import { COLLECTIONS } from "../../../util/collections.enum";
import { Stage } from "../../cycles/stages/stage.model";

interface IProjectStage extends Document {
    stage: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    status: ProjectStageStatus;
    documentPath: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectStageSchema = new Schema<IProjectStage>({
    stage: {
        type: Schema.Types.ObjectId,
        ref: Stage.modelName,
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
    status: {
        type: String,
        enum: Object.values(ProjectStageStatus),
        default: ProjectStageStatus.pending,
        required: true
    },
}, { timestamps: true });

ProjectStageSchema.index({ project: 1, stage: 1 }, { unique: true });
export const ProjectStage = model<IProjectStage>(COLLECTIONS.PROJECT_STAGE, ProjectStageSchema);