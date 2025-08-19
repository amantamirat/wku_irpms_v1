import { Schema, Types } from "mongoose";
import { BaseEvaluation, BaseEvaluationDocument } from "./base.evaluation.model";
import { COLLECTIONS } from "../../enums/collections.enum";
import { EvalType } from "./enums/eval.type.enum";
import { FormType } from "./enums/from.type.enum";

interface CriterionDocument extends BaseEvaluationDocument {
    type: EvalType.criterion;
    parent: Types.ObjectId;
    weight_value: number;
    form_type: FormType;
}

const CriterionSchema = new Schema<CriterionDocument>({
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.EVAL, required: true },
    weight_value: { type: Number, min: 1, max: 100, required: true },
    form_type: { type: String, enum: Object.values(FormType), required: true }
});

export const Criterion = BaseEvaluation.discriminator<CriterionDocument>(EvalType.criterion, CriterionSchema);