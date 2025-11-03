import mongoose, { model, Schema } from "mongoose";
import { ProjectStageStatus } from "./stage.enum";
import { COLLECTIONS } from "../../../util/collections.enum";
import { Stage } from "../../call/stages/stage.model";

interface IProjectStage extends Document {
    project: mongoose.Types.ObjectId;
    stage: mongoose.Types.ObjectId;
    status: ProjectStageStatus;
    documentPath: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProjectStageSchema = new Schema<IProjectStage>({
    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
        immutable: true,
        required: true
    },    
    stage: {
        type: Schema.Types.ObjectId,
        ref: Stage.modelName,
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