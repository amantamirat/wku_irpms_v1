import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { Evaluation } from "../../evaluations/evaluation.model";
import { StageStatus } from "./stage.status";


export interface IStage extends Document {
    _id: string;
    call: mongoose.Types.ObjectId;
    name: string;
    order: number;
    evaluation: mongoose.Types.ObjectId;
    deadline: Date;
    status: StageStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const StageSchema = new Schema<IStage>({
    call: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL,
        required: true,
        immutable: true,
    },
    name: {
        type: String,
        required: true
    },
    order: {
        type: Number,
        required: true,
        //immutable: true,
    },
    evaluation: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.EVALUATION,
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


StageSchema.index({ call: 1, order: 1 }, { unique: true });

export const Stage = model<IStage>(COLLECTIONS.STAGE, StageSchema);
