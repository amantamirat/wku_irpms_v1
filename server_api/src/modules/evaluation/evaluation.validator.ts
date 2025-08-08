import Joi from 'joi';
import { EvaluationType, FormType } from './evaluation.model';

export const validateEvaluation = (data: any) => {
  let schema = Joi.object({
    type: Joi.string().valid(...Object.values(EvaluationType)).required(),
    title: Joi.string().required(),
    directorate: Joi.string().hex().length(24).optional(),
    parent: Joi.string().hex().length(24).optional(),
    stage_level: Joi.number().forbidden(),
    weight_value: Joi.number().min(0).optional(),
    form_type: Joi.string().valid(...Object.values(FormType)).optional()
  });

  switch (data.type) {
    case EvaluationType.evaluation:
    case EvaluationType.validation:
      schema = schema.append({
        directorate: Joi.string().hex().length(24).required(),
        parent: Joi.forbidden(),
      });
      break;

    case EvaluationType.stage:
      schema = schema.append({
        parent: Joi.string().hex().length(24).required(),
        directorate: Joi.forbidden(),
        //stage_level: Joi.number().min(1).max(10).required(),
      });
      break;

    case EvaluationType.criterion:
      schema = schema.append({
        parent: Joi.string().hex().length(24).required(),
        directorate: Joi.forbidden(),
        weight_value: Joi.number().min(0).required(),
        form_type: Joi.string().valid(...Object.values(FormType)).required()
      });
      break;

    case EvaluationType.option:
      schema = schema.append({
        parent: Joi.string().hex().length(24).required(),
        directorate: Joi.forbidden(),
        weight_value: Joi.number().min(0).required()
      });
      break;

    default:
      break;
  }

  return schema.validate(data, { abortEarly: false, stripUnknown: true });
};
