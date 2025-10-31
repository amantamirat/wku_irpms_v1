import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../util/collections.enum";
import { Directorate } from "../organization/organization.model";

// =========================
// 1️⃣ Evaluation (Root)
// =========================

export interface IEvaluation extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
    {
        directorate: {
            type: Schema.Types.ObjectId,
            ref: Directorate.modelName,
            required: true,
            immutable: true,
        },
        title: { type: String, required: true },
    },
    { timestamps: true }
);

export const Evaluation = model<IEvaluation>(
    COLLECTIONS.EVAL,
    EvaluationSchema
);




