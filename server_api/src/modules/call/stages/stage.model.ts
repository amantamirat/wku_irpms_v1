import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../util/collections.enum";
import { StageStatus, StageType } from "./stage.enum";
import { Evaluation } from "../../evaluations/evaluation.model";


interface IStage extends Document {
    call: mongoose.Types.ObjectId;
    name: string;
    type: StageType;
    evaluation: mongoose.Types.ObjectId; // Refers to Evaluation
    deadline: Date; //Submission Deadline
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
    type: {
        type: String,
        enum: Object.values(StageType),
        default: StageType.screening,
        required: true
    },
    evaluation: {
        type: Schema.Types.ObjectId,
        ref: Evaluation.modelName,
        required: true,
        //immutable: true,
    },
    deadline: {
        type: Date,
    },
    status: {
        type: String,
        enum: Object.values(StageStatus),
        default: StageStatus.planned,
        required: true
    }
}, { timestamps: true });

StageSchema.index({ call: 1, evaluation: 1 }, { unique: true });

export const Stage = model<IStage>(COLLECTIONS.STAGE, StageSchema);
