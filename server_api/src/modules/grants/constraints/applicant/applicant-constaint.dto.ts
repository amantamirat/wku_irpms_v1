import { CreateConstraintDTO } from "../constraint.dto";
import { ApplicantConstraintType } from "./applicant-constaint-type";
import { OperationMode } from "./operation-mode-type";

export interface CreateApplicantConstraintDTO extends CreateConstraintDTO {
    constraint: ApplicantConstraintType;
    mode: OperationMode;
}


