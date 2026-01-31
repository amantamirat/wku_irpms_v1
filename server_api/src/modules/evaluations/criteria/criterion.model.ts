// =========================
// 2️⃣ Criterion
// =========================

import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { FormType } from "./criterion.enum";
import { Evaluation } from "../evaluation.model";

export interface ICriterion extends Document {
    _id: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId;
    title: string;
    weight: number;
    formType: FormType;
    createdAt?: Date;
    updatedAt?: Date;
}

const CriterionSchema = new Schema<ICriterion>(
    {
        evaluation: {
            type: Schema.Types.ObjectId,
            ref: Evaluation.modelName,
            required: true,
            immutable: true,
        },
        title: { type: String, required: true },
        weight: {
            type: Number,
            min: 0,
            max: 100,
            required: true,
        },
        formType: {
            type: String,
            enum: Object.values(FormType),
            required: true
        },
    },
    { timestamps: true }
);

export const Criterion = model<ICriterion>(
    COLLECTIONS.CRITERION,
    CriterionSchema
);