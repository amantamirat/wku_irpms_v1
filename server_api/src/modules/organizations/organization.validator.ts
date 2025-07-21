import Joi from 'joi';
import { OrganizationType, AcademicLevel, Classification, Ownership, Category } from './organization.model';

const baseSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid(...Object.values(OrganizationType)).required(),

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
    case OrganizationType.Program:
      schema = schema.append({
        academic_level: Joi.string().valid(...Object.values(AcademicLevel)).required(),
        classification: Joi.string().valid(...Object.values(Classification)).required(),
      });
      break;

    case OrganizationType.Specialization:
      schema = schema.append({
        academic_level: Joi.string().valid(...Object.values(AcademicLevel)).required(),
      });
      break;

    case OrganizationType.External:
      schema = schema.append({
        ownership: Joi.string().valid(...Object.values(Ownership)).required(),
      });
      break;

    case OrganizationType.Position:
      schema = schema.append({
        category: Joi.string().valid(...Object.values(Category)).required(),
      });
      break;

    default:
      break;
  }

  const parentRequiredTypes = [
    OrganizationType.Department,
    OrganizationType.Program,
    OrganizationType.Center,
    OrganizationType.External,
    OrganizationType.Rank
  ];

  if (parentRequiredTypes.includes(data.type)) {
    schema = schema.append({
      parent: Joi.string().hex().length(24).required()
    });
  }
  return schema.validate(data, { abortEarly: false, stripUnknown: true });
};
