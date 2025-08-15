import Joi from 'joi';
import { ThemeLevel, ThemeType } from './theme.model';

export const validateTheme = (data: any) => {
  let schema = Joi.object({
    type: Joi.string().valid(...Object.values(ThemeType)).required(),
    title: Joi.string().required(),
    priority: Joi.any().optional(),
    parent: Joi.string().hex().length(24).optional(),
    directorate: Joi.string().hex().length(24).optional(),
  });

  switch (data.type) {
    case ThemeType.catalog:
      schema = schema.append({
        priority: Joi.string().valid(...Object.values(ThemeLevel)).required(),
        directorate: Joi.string().hex().length(24).required(),
        parent: Joi.forbidden(),
      });
      break;
    case ThemeType.theme:
    case ThemeType.subTheme:
    case ThemeType.focusArea:
      schema = schema.append({
        parent: Joi.string().hex().length(24).required(),
        priority: Joi.number().integer().min(1).max(30).optional(),
        directorate: Joi.forbidden(),
      });
      break;

    default:
      break;
  }

  return schema.validate(data, { abortEarly: false, stripUnknown: true });
};
