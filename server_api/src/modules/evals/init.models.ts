import { Criterion } from "./criterion.model";
import { Evaluation, Validation } from "./evaluation.model";
import { Stage } from "./stage.model";
import { Option } from "./option.model";


export function initializeEvalModels() {
  return {
    Evaluation,
    Validation,
    Stage,
    Criterion,
    Option
  };
}