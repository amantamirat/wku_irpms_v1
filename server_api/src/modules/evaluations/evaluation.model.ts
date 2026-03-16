import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export interface IEvaluation extends Document {
    organization: mongoose.Types.ObjectId;
    title: string;
    description?: string;
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
        description: { type: String }
    },
    { timestamps: true }
);

export const Evaluation = model<IEvaluation>(
    COLLECTIONS.EVALUATION,
    EvaluationSchema
);




