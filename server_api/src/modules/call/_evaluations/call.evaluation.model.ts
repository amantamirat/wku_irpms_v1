import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../util/collections.enum";
import { EvaluationStatus } from "./call.evaluation.enum";
import { Evaluation } from "../../evaluations/evaluation.model";


interface ICallEvaluation extends Document {
    call: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId; // Refers to Evaluation
    deadline?: Date; //Submission Deadline
    status?: EvaluationStatus;
}

const CallEvaluationSchema = new Schema<ICallEvaluation>({
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

CallEvaluationSchema.index({ call: 1, evaluation: 1 }, { unique: true });

export const CallEvaluation = model<ICallEvaluation>(COLLECTIONS.CALL_EVALUATION, CallEvaluationSchema);
