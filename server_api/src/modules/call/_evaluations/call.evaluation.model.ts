import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../util/collections.enum";
import { EvaluationStatus } from "./call.evaluation.enum";
import { Evaluation } from "../../evaluations/evaluation.model";


interface ICallStage extends Document {
    call: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId; // Refers to Evaluation
    deadline?: Date; //Submission Deadline
    status?: EvaluationStatus;
}

const CallStageSchema = new Schema<ICallStage>({
    call: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALL,
        required: true,
        immutable: true,
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
        enum: Object.values(EvaluationStatus),
        default: EvaluationStatus.planned,
        required: true
    }
}, { timestamps: true });

CallStageSchema.index({ call: 1, evaluation: 1 }, { unique: true });

export const CallStage = model<ICallStage>(COLLECTIONS.CALL_STAGE, CallStageSchema);
