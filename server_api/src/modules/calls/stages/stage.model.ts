import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { StageStatus } from "./stage.status";

export interface ICallStage extends Document {
    _id: string;
    call: mongoose.Types.ObjectId;
    grantStage: mongoose.Types.ObjectId;
    deadline: Date;
    status: StageStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallStageSchema = new Schema<ICallStage>({
    call: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL,
        required: true,
        immutable: true,
    },
    grantStage: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.GRANT_STAGE,
        required: true,
        immutable: true,
    },
    deadline: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(StageStatus),
        default: StageStatus.planned,
        required: true
    }
}, { timestamps: true });

CallStageSchema.index({ call: 1, grantStage: 1 }, { unique: true });
export const CallStage = model<ICallStage>(COLLECTIONS.CALL_STAGE, CallStageSchema);
