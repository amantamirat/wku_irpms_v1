import { Schema, Types } from "mongoose";
import { EvalType } from "./enums/eval.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { BaseEvaluation, BaseEvaluationDocument } from "./base.evaluation.model";
import { Grant } from "../grants/grant.model";

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
    directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGAN, required: true, immutable: true },
});

EValSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const evalId = this._id;
  const isReferencedByGrant = await Grant.exists({ evaluation: evalId });
  if (isReferencedByGrant) {
    const err = new Error(`Cannot delete: ${this.title} it is referenced in Grant.`);
    return next(err);
  }
  next();
});

// Create discriminators
export const Evaluation = BaseEvaluation.discriminator<EvaluationDocument>(EvalType.evaluation, EValSchema);

export const Validation = BaseEvaluation.discriminator<ValidationDocument>(EvalType.validation, EValSchema);
