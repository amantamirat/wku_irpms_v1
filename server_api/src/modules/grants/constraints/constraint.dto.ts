import { OperationMode } from "./applicant/applicant-constraint.model";
import { ConstraintType } from "./constraint.model";

export interface CreateConstraintDTO {
    type: ConstraintType;
    grant: string;
    constraint: string;
    min?: number;
    max?: number;
    mode?:OperationMode;
}

export interface UpdateConstraintDTO {
    id: string,
    data: Partial<{
        min: number;
        max: number;
    }>;
}

export interface GetConstraintOptions {
    type?: ConstraintType;
    grant?: string
}

export interface ExistsConstraintDTO {
    grant?: string;                 // Grant ID to filter by
    type?: ConstraintType;          // Optional constraint type (PROJECT / APPLICANT)
    constraint?: string;            // Optional specific constraint (like BUDGET_TOTAL)
}