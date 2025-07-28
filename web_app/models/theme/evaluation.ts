import { Organization } from "../organization";

export enum EvalType {
  evaluation = 'Evaluation',
  validation = 'Validation',
  stage = 'Stage',
  weight = 'Weight',
  option = 'Option'
}

export enum FormType {
  open = 'Open',
  closed = 'Closed'
}

export type Evaluation = {
  _id?: string;
  type: EvalType;
  title: string;
  directorate?: string | Organization;
  parent?: string | Evaluation;
  stage_level?: number;
  max_value?: number;
  form_type?: FormType;
  createdAt?: Date;
  updatedAt?: Date;
};

export const validateEvaluation = (evaluation: Evaluation): { valid: boolean; message?: string } => {
  const { type, title, directorate, parent, stage_level, max_value, form_type } = evaluation;

  if (!type) {
    return { valid: false, message: 'Evaluation type is required.' };
  }

  if (!title || title.trim().length === 0) {
    return { valid: false, message: 'Title is required.' };
  }

  if (type === EvalType.evaluation || type === EvalType.validation) {
    if (!directorate) {
      return { valid: false, message: `'${type}' requires a directorate.` };
    }
    if (parent) {
      return { valid: false, message: `'${type}' must not have a parent.` };
    }
  } else {
    if (!parent) {
      return { valid: false, message: `'Stage' requires a parent.` };
    }
    if (directorate) {
      return { valid: false, message: `'Stage' must not have a directorate.` };
    }
    // Stage
    if (type === EvalType.stage) {
      if (stage_level == null) {
        return { valid: false, message: `'Stage level' is required.` };
      }
      if (stage_level < 1 || stage_level > 10) {
        return { valid: false, message: `'Stage level' must be between 1 and 10.` };
      }
    }
    // Weight
    else if (type === EvalType.weight) {
      if (max_value == null || max_value < 0) {
        return { valid: false, message: `'Max value' is required and must be >= 0 for 'Weight'.` };
      }
      if (!form_type || !Object.values(FormType).includes(form_type)) {
        return { valid: false, message: `'Form type' is required and must be valid for 'Weight'.` };
      }
    }
    // Option
    else if (type === EvalType.option) {
      if (max_value == null || max_value < 0) {
        return { valid: false, message: `'Max value' is required and must be >= 0 for 'Option'.` };
      }
    }
    // Unknown type (just in case)
    else {
      return { valid: false, message: `Unknown evaluation type: ${type}` };
    }

  }
  return { valid: true };
};
