import { ConstraintType } from "./constraint-type.enum";

export interface CreateConstraintDTO {
    type: ConstraintType;
    grant: string;
    constraint: string;
}


export interface GetConstraintOptions {
    grantId?: string
    type?: ConstraintType;
}