import { ProjectConstraintType } from "./project-constraint-type.enum";

export interface CreateConstraintDTO {
    grant: string;
    constraint: ProjectConstraintType;
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
    grant?: string
}

export interface ExistsConstraintDTO {
    grant?: string;                 // Grant ID to filter by
    constraint?: ProjectConstraintType;   // Optional specific constraint (like BUDGET_TOTAL)
}