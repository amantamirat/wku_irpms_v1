import mongoose, { model, Schema } from "mongoose";
import { EvaluationType, FormType } from "./evaluation.enum";
import { COLLECTIONS } from "../../../util/collections.enum";
import { Directorate } from "../../organization/organization.model";


interface IBaseEvaluation extends Document {
  type: EvaluationType;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BaseEvaluationSchema = new Schema<IBaseEvaluation>(
  {
    type: {
      type: String,
      enum: Object.values(EvaluationType),
      required: true
    },
    title: { type: String, required: true }
  },
  { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

export const BaseEvaluation = model<IBaseEvaluation>(COLLECTIONS.EVALUATION, BaseEvaluationSchema);

interface IEvaluation extends IBaseEvaluation {
  type: EvaluationType.evaluation;
  directorate: mongoose.Types.ObjectId;
}

const EvaluationSchema = new Schema<IEvaluation>({
  directorate: {
    type: Schema.Types.ObjectId,
    ref: Directorate.modelName,
    required: true,
    immutable: true,
  },
});

export const Evaluation = BaseEvaluation.discriminator<IEvaluation>(EvaluationType.evaluation, EvaluationSchema);

interface ChildEvaluationDocument extends IBaseEvaluation {
  parent: mongoose.Types.ObjectId;
}

export interface IStage extends ChildEvaluationDocument {
  type: EvaluationType.stage;
  order: number;
  isValidation?: boolean;
}

const StageSchema = new Schema<IStage>({
  parent: {
    type: Schema.Types.ObjectId,
    ref: Evaluation.modelName,
    required: true,
    immutable: true,
  },
  order: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  isValidation: {
    type: Boolean
  }
});

StageSchema.index({ parent: 1, order: 1 }, { unique: true });

export const Stage = BaseEvaluation.discriminator<IStage>(EvaluationType.stage, StageSchema);

interface ICriterion extends ChildEvaluationDocument {
  type: EvaluationType.criterion;
  weight_value: number;
  form_type: FormType;
}

const CriterionSchema = new Schema<ICriterion>({
  parent: {
    type: Schema.Types.ObjectId,
    ref: Stage.modelName,
    required: true,
    immutable: true,
  },
  weight_value: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  form_type: {
    type: String,
    enum: Object.values(FormType),
    required: true
  }
});

export const Criterion = BaseEvaluation.discriminator<ICriterion>(EvaluationType.criterion, CriterionSchema);


interface IOption extends ChildEvaluationDocument {
  type: EvaluationType.option;
  weight_value: number;
}

const OptionSchema = new Schema<IOption>({
  parent: {
    type: Schema.Types.ObjectId,
    ref: Criterion.modelName,
    required: true,
    immutable: true,
  },
  weight_value: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  }
});

OptionSchema.index({ parent: 1, weight_value: 1 }, { unique: true });
export const Option = BaseEvaluation.discriminator<IOption>(EvaluationType.option, OptionSchema);




