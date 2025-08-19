import { Schema, Types } from "mongoose";
import { BaseEvaluation, BaseEvaluationDocument } from "./base.evaluation.model";
import { COLLECTIONS } from "../../enums/collections.enum";
import { EvalType } from "./enums/eval.type.enum";

interface OptionDocument extends BaseEvaluationDocument {
    type: EvalType.option;
    parent: Types.ObjectId;
    weight_value: number;
}

const OptionSchema = new Schema<OptionDocument>({
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.EVAL, required: true },
    weight_value: { type: Number, min: 0, max: 100, required: true }
});

export const Option = BaseEvaluation.discriminator<OptionDocument>(EvalType.option, OptionSchema);