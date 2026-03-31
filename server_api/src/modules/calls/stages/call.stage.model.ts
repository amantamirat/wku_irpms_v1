import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum CallStageStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export interface ICallStage extends Document {
    _id: string;
    call: mongoose.Types.ObjectId;
    grantStage: mongoose.Types.ObjectId;
    order: number;
    deadline: Date;
    status: CallStageStatus;
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
    order: {
        type: Number,
        required: true,
        immutable: true,
    },
    deadline: {
        type: Date,
        required: true,
        default: () => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1);
            return d;
        }
    },
    status: {
        type: String,
        enum: Object.values(CallStageStatus),
        default: CallStageStatus.planned,
        required: true
    }
}, { timestamps: true });
CallStageSchema.index({ call: 1, order: 1 }, { unique: true });
CallStageSchema.index({ call: 1, grantStage: 1 }, { unique: true });
export const CallStage = model<ICallStage>(COLLECTIONS.CALL_STAGE, CallStageSchema);
