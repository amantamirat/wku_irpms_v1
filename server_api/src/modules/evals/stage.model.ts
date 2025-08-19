import { Schema, Types } from "mongoose";
import { BaseEvaluation, BaseEvaluationDocument } from "./base.evaluation.model";
import { COLLECTIONS } from "../../enums/collections.enum";
import { EvalType } from "./enums/eval.type.enum";

interface StageDocument extends BaseEvaluationDocument {
    type: EvalType.stage;
    parent: Types.ObjectId;
    stage_level: number;
}

const StageSchema = new Schema<StageDocument>({
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.EVAL, required: true },
    stage_level: { type: Number, min: 1, max: 10, required: true },
});

export const Stage = BaseEvaluation.discriminator<StageDocument>(EvalType.stage, StageSchema);