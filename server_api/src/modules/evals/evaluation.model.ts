import { model, Schema, Types } from "mongoose";
import { EvaluationType, FormType } from "./evaluation.enum";
import { COLLECTIONS } from "../../enums/collections.enum";


interface BaseEvaluationDocument extends Document {
  type: EvaluationType;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BaseEvaluationSchema = new Schema<BaseEvaluationDocument>(
  {
    type: { type: String, enum: Object.values(EvaluationType), required: true },
    title: { type: String, required: true }
  },
  { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

export const BaseEvaluation = model<BaseEvaluationDocument>(COLLECTIONS.EVAL, BaseEvaluationSchema);

interface EvaluationDocument extends BaseEvaluationDocument {
  type: EvaluationType.evaluation;
  directorate: Types.ObjectId;
}

const EvaluationSchema = new Schema<EvaluationDocument>({
  directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGAN, required: true, immutable: true },
});

export const Evaluation = BaseEvaluation.discriminator<EvaluationDocument>(EvaluationType.evaluation, EvaluationSchema);


interface StageDocument extends BaseEvaluationDocument {
  type: EvaluationType.stage;
  parent: Types.ObjectId;
  order: number;
}

const StageSchema = new Schema<StageDocument>({
  parent: { type: Schema.Types.ObjectId, ref: Evaluation.modelName, required: true },
  order: { type: Number, min: 1, max: 10, required: true },
});

StageSchema.index({ parent: 1, order: 1 }, { unique: true });

export const Stage = BaseEvaluation.discriminator<StageDocument>(EvaluationType.stage, StageSchema);

interface CriterionDocument extends BaseEvaluationDocument {
  type: EvaluationType.criterion;
  parent: Types.ObjectId;
  weight_value: number;
  form_type: FormType;
}

const CriterionSchema = new Schema<CriterionDocument>({
  parent: { type: Schema.Types.ObjectId, ref: Stage.modelName, required: true },
  weight_value: { type: Number, min: 1, max: 100, required: true },
  form_type: { type: String, enum: Object.values(FormType), required: true }
});

export const Criterion = BaseEvaluation.discriminator<CriterionDocument>(EvaluationType.criterion, CriterionSchema);


interface OptionDocument extends BaseEvaluationDocument {
  type: EvaluationType.option;
  parent: Types.ObjectId;
  weight_value: number;
}

const OptionSchema = new Schema<OptionDocument>({
  parent: { type: Schema.Types.ObjectId, ref: Criterion.modelName, required: true },
  weight_value: { type: Number, min: 0, max: 100, required: true }
});

export const Option = BaseEvaluation.discriminator<OptionDocument>(EvaluationType.option, OptionSchema);


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


