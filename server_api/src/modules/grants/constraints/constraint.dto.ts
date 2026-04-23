import { ConstraintType } from "./constraint.model";

export interface CreateConstraintDTO {
    grant: string;
    constraint: ConstraintType;
    min: number;
    max: number;
}

export interface UpdateConstraintDTO {
    id: string,
    data: Partial<{
        min: number;
        max: number;
    }>;
}

export interface GetConstraintOptions {
    grant?: string;
    constraints?: ConstraintType[];
}

export interface ExistsConstraintDTO {
    grant?: string;                 // Grant ID to filter by
    constraint?: ConstraintType;   // Optional specific constraint (like BUDGET_TOTAL)
}