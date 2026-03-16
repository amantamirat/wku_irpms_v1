import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { EvalStatus } from "./evaluation.state-machine";

export interface IEvaluation extends Document {
    organization: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: EvalStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
    {
        organization: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.ORGANIZATION,
            required: true,
            immutable: true,
        },
        title: { type: String, required: true },
        description: { type: String },
        status: {
            type: String,
            enum: Object.values(EvalStatus),
            default: EvalStatus.planned,
            required: true
        },
    },
    { timestamps: true }
);

export const Evaluation = model<IEvaluation>(
    COLLECTIONS.EVALUATION,
    EvaluationSchema
);




