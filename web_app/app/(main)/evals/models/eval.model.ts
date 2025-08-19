import { Organization } from "@/models/organization";


export enum EvalType {
  evaluation = 'Evaluation',
  validation = 'Validation',
  stage = 'Stage',
  criterion = 'Criterion',
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
  weight_value?: number;
  form_type?: FormType;
  createdAt?: Date;
  updatedAt?: Date;
};

export const validateEvaluation = (evaluation: Evaluation): { valid: boolean; message?: string } => {
  const { type, title, directorate, parent, stage_level, weight_value, form_type } = evaluation;

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
  }
  else if (type === EvalType.stage || type === EvalType.criterion || type === EvalType.option) {
    if (!parent) {
      return { valid: false, message: `'${type}' requires a parent.` };
    }
    if (directorate) {
      return { valid: false, message: `'${type}' must not have a directorate.` };
    }

    /*
    if (type === EvalType.stage) {
      if (stage_level == null || (stage_level < 1 || stage_level > 10)) {
        return { valid: false, message: `'Stage level' is required and must be between 1 and 10..` };
      }
    }
    */    

    if (type === EvalType.criterion || type === EvalType.option) {
      if (weight_value == null || weight_value < 0 || weight_value > 100) {
        return { valid: false, message: `' value' is required and must be between 1 and 100..` };
      }

      if (type === EvalType.criterion) {
        if (!form_type || !Object.values(FormType).includes(form_type)) {
          return { valid: false, message: ` Creterion 'Form type' is required and must be valid.` };
        }
      }
    }
  }
  else {
    return { valid: false, message: `Unknown evaluation type: ${type}` };
  }
  return { valid: true };
};
