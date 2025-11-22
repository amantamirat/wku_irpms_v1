import { CreateConstraintDTO } from "../constraint.dto";
import { ConstraintType } from "../constraint-type.enum";
import { ProjectConstraintType } from "./project-constraint-type.enum";

export interface CreateProjectConstraintDTO extends CreateConstraintDTO {
    type: ConstraintType.PROJECT;
    constraint: ProjectConstraintType;
    min: number;
    max: number;
}

export interface UpdateProjectConstraintDTO {
    id: string,
    data: Partial<{
        min: number;
        max: number;
    }>;
}

