import { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { EvalType } from "./enums/eval.type.enum";


export interface BaseEvaluationDocument extends Document {
    type: EvalType;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const BaseEvalSchema = new Schema<BaseEvaluationDocument>(
    {
        type: { type: String, enum: Object.values(EvalType), required: true },
        title: { type: String, required: true }
    },
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

// Base model
export const BaseEvaluation = model<BaseEvaluationDocument>(COLLECTIONS.EVAL, BaseEvalSchema);