import { Schema, Types } from "mongoose";
import { EvalType } from "./enums/eval.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { BaseEvaluation, BaseEvaluationDocument } from "./base.evaluation.model";

interface EValDocument extends BaseEvaluationDocument {
    directorate: Types.ObjectId;
}

interface EvaluationDocument extends EValDocument {
    type: EvalType.evaluation;
}

interface ValidationDocument extends EValDocument {
    type: EvalType.validation;
}

const EValSchema = new Schema<EValDocument>({
    directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGANIZATION, required: true, immutable: true },
});

// Create discriminators
export const Evaluation = BaseEvaluation.discriminator<EvaluationDocument>(EvalType.evaluation, EValSchema);

export const Validation = BaseEvaluation.discriminator<ValidationDocument>(EvalType.validation, EValSchema);
