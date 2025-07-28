import Joi from 'joi';
import { ThemeType } from './theme.model';

export const validateTheme = (data: any) => {
  let schema = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().valid(...Object.values(ThemeType)).required(),
    parent: Joi.string().hex().length(24).optional(),
    directorate: Joi.string().hex().length(24).optional(),
  });

  switch (data.type) {
    case ThemeType.theme:
      schema = schema.append({
        directorate: Joi.string().hex().length(24).required(),
        parent: Joi.forbidden(),
      });
      break;

    case ThemeType.priorityArea:
    case ThemeType.subArea:
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
