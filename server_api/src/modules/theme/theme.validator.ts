import Joi from 'joi';
import { ThemeType } from './theme.model';

export const validateTheme = (data: any) => {
  let schema = Joi.object({
    type: Joi.string().valid(...Object.values(ThemeType)).required(),
    title: Joi.string().required(),
    priority: Joi.number().optional(),
    parent: Joi.string().hex().length(24).optional(),
    directorate: Joi.string().hex().length(24).optional(),
  });

  switch (data.type) {
    case ThemeType.catalog:
      schema = schema.append({
        priority: Joi.number().less(3).required().messages({
          'any.required': 'Level is required for a catalog',
          'number.less': 'Level for a catalog must be less than 3',
          'number.base': 'Level must be a number',
        }),
        directorate: Joi.string().hex().length(24).required(),
        parent: Joi.forbidden(),
      });
      break;
    case ThemeType.theme:
    case ThemeType.subTheme:
    case ThemeType.focusArea:
      schema = schema.append({
        parent: Joi.string().hex().length(24).required(),
        directorate: Joi.forbidden(),
      });
      break;

    default:
      break;
  }

  return schema.validate(data, { abortEarly: false, stripUnknown: true });
};
