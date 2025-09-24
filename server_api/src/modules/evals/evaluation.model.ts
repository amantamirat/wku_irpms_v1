import { model, Schema, Types } from "mongoose";
import { EvalType } from "./enums/eval.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { Grant } from "../grants/grant.model";
import { FormType } from "./enums/from.type.enum";


interface BaseEvaluationDocument extends Document {
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

export const BaseEvaluation = model<BaseEvaluationDocument>(COLLECTIONS.EVAL, BaseEvalSchema);

interface EvaluationDocument extends BaseEvaluationDocument {
  type: EvalType.evaluation;
  directorate: Types.ObjectId;
}

const EvaluationSchema = new Schema<EvaluationDocument>({
  directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGAN, required: true, immutable: true },
});

export const Evaluation = BaseEvaluation.discriminator<EvaluationDocument>(EvalType.evaluation, EvaluationSchema);


interface StageDocument extends BaseEvaluationDocument {
    type: EvalType.stage;
    parent: Types.ObjectId;
    order: number;
}

const StageSchema = new Schema<StageDocument>({
    parent: { type: Schema.Types.ObjectId, ref: Evaluation.modelName, required: true },
    order: { type: Number, min: 1, max: 10, required: true },
});

export const Stage = BaseEvaluation.discriminator<StageDocument>(EvalType.stage, StageSchema);

interface CriterionDocument extends BaseEvaluationDocument {
    type: EvalType.criterion;
    parent: Types.ObjectId;
    weight_value: number;
    form_type: FormType;
}

const CriterionSchema = new Schema<CriterionDocument>({
    parent: { type: Schema.Types.ObjectId, ref: Stage.modelName, required: true },
    weight_value: { type: Number, min: 1, max: 100, required: true },
    form_type: { type: String, enum: Object.values(FormType), required: true }
});

export const Criterion = BaseEvaluation.discriminator<CriterionDocument>(EvalType.criterion, CriterionSchema);


interface OptionDocument extends BaseEvaluationDocument {
    type: EvalType.option;
    parent: Types.ObjectId;
    weight_value: number;
}

const OptionSchema = new Schema<OptionDocument>({
    parent: { type: Schema.Types.ObjectId, ref: Criterion.modelName, required: true },
    weight_value: { type: Number, min: 0, max: 100, required: true }
});

export const Option = BaseEvaluation.discriminator<OptionDocument>(EvalType.option, OptionSchema);


/*

interface ValidationDocument extends EValDocument {
    type: EvalType.validation;
}

EValSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const evalId = this._id;
  const isReferencedByGrant = await Grant.exists({ evaluation: evalId });
  if (isReferencedByGrant) {
    const err = new Error(`Cannot delete: ${this.title} it is referenced in Grant.`);
    return next(err);
  }
  next();
});
export const Validation = BaseEvaluation.discriminator<ValidationDocument>(EvalType.validation, EvaluationSchema);

*/

// Create discriminators


