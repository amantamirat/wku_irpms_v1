import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../util/collections.enum";
import { Stage } from "../evaluations/evaluation.model";
import { CallStageStatus } from "./call.stage.enum";


interface ICallStage extends Document {
    call: mongoose.Types.ObjectId;
    stage: mongoose.Types.ObjectId; // Refers to Stage
    deadline?: Date;
    status?: CallStageStatus;
}

const CallStageSchema = new Schema<ICallStage>({
    call: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL,
        required: true,
        immutable: true,
    },
    stage: {
        type: Schema.Types.ObjectId,
        ref: Stage.modelName,
        required: true,
        immutable: true,
    },
    deadline: {
        type: Date,
    },
    status: {
        type: String,
        enum: Object.values(CallStageStatus),
        default: CallStageStatus.pending,
        required: true
    }
}, { timestamps: true });

CallStageSchema.index({ call: 1, stage: 1 }, { unique: true });

export const CallStage = model<ICallStage>(COLLECTIONS.CALL_STAGE, CallStageSchema);
