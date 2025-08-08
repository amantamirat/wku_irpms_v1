import Joi from 'joi';
import { AcademicLevel } from './enums/academicLevel.enum';
import { Classification } from './enums/classification.enum';
import { Ownership } from './enums/ownership.enum';
import { Category } from './enums/category.enum';
import { Unit } from './enums/unit.enum';

const baseSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid(...Object.values(Unit)).required(),

  academic_level: Joi.string().valid(...Object.values(AcademicLevel)),
  classification: Joi.string().valid(...Object.values(Classification)),
  ownership: Joi.string().valid(...Object.values(Ownership)),
  category: Joi.string().valid(...Object.values(Category)),

  address: Joi.object({
    region: Joi.string(),
    zone: Joi.string(),
    woreda: Joi.string(),
    city: Joi.string(),
    kebele: Joi.string()
  }),

  parent: Joi.string().hex().length(24)
});

/**
 * Extended conditional schema based on 'type'
 */
export const validateOrganization = (data: any) => {
  let schema = baseSchema;

  switch (data.type) {
    case Unit.Program:
      schema = schema.append({
        academic_level: Joi.string().valid(...Object.values(AcademicLevel)).required(),
        classification: Joi.string().valid(...Object.values(Classification)).required(),
      });
      break;

    case Unit.Specialization:
      schema = schema.append({
        academic_level: Joi.string().valid(...Object.values(AcademicLevel)).required(),
      });
      break;

    case Unit.External:
      schema = schema.append({
        ownership: Joi.string().valid(...Object.values(Ownership)).required(),
      });
      break;

    case Unit.Position:
      schema = schema.append({
        category: Joi.string().valid(...Object.values(Category)).required(),
      });
      break;

    default:
      break;
  }

  const parentRequiredTypes = [
    Unit.Department,
    Unit.Program,
    Unit.Center,
    Unit.External,
    Unit.Rank
  ];

  if (parentRequiredTypes.includes(data.type)) {
    schema = schema.append({
      parent: Joi.string().hex().length(24).required()
    });
  }
  return schema.validate(data, { abortEarly: false, stripUnknown: true });
};
