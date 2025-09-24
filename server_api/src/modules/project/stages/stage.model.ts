import mongoose, { model, Schema } from "mongoose";
import { StageStatus } from "./stage.enum";
import { COLLECTIONS } from "../../../enums/collections.enum";
import { Stage } from "../../evaluations/evaluation.model";

interface IProjectStage extends Document {
    project: mongoose.Types.ObjectId;
    stage: mongoose.Types.ObjectId;
    status: StageStatus;
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
        enum: Object.values(StageStatus),
        default: StageStatus.pending,
        required: true
    },
}, { timestamps: true });

export const ProjectStage = model<IProjectStage>(COLLECTIONS.PROJECT_STAGE, ProjectStageSchema);