import { Schema } from "mongoose";
import { ConstraintType } from "../constraint-type.enum";
import { Constraint, IConstraint } from "../constraint.model";
import { ProjectConstraintType } from "./project-constraint-type.enum";

//Project Constraints Model
export interface IProjectConstraint extends IConstraint {
    type: ConstraintType.PROJECT;
    constraint: ProjectConstraintType;
    max: number;
    min: number;
}

const ProjectConstraintSchema = new Schema<IProjectConstraint>({
    constraint: {
        type: String,
        enum: Object.values(ProjectConstraintType),
        required: true,
        immutable: true,
    },
    max: {
        type: Number,
        min: 0,
        required: true
    },
    min: {
        type: Number,
        min: 0,
        required: true
    },
});

ProjectConstraintSchema.index({ grant: 1, type: 1, constraint: 1 }, { unique: true });
export const ProjectConstraint = Constraint.discriminator<IProjectConstraint>(ConstraintType.PROJECT, ProjectConstraintSchema);
