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

BaseEvalSchema.index({ parent: 1, stage_level: 1 },
    {
        unique: true,
        partialFilterExpression: {            
            type: EvalType.stage
        }
    }
);

BaseEvalSchema.index({ parent: 1, weight_value: 1 },
    {
        unique: true,
        partialFilterExpression: {            
            type: EvalType.option
        }
    }
);

BaseEvalSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const evalId = this._id;
    const hasChildren = await BaseEvaluation.exists({ parent: evalId });
    if (hasChildren) {
        const err = new Error(`Cannot delete: ${this.title} ${this.type} it is a parent of other evaluations.`);
        return next(err);
    }
    next();
});

// Base model
export const BaseEvaluation = model<BaseEvaluationDocument>(COLLECTIONS.EVAL, BaseEvalSchema);