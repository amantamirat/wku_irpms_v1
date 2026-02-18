import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { ProjectConstraintType } from "./project-constraint-type.enum";

export interface IConstraint extends Document {
    grant: mongoose.Types.ObjectId;
    constraint: ProjectConstraintType;
    max: number;
    min: number;
    createdAt?: Date;
    updatedAt?: Date;
}
const ConstraintSchema = new Schema<IConstraint>(
    {
        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
            required: true,
            immutable: true,
        },
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
        }
    },
    {
        timestamps: true
    }
);


ConstraintSchema.index({ grant: 1, constraint: 1 }, { unique: true });
export const Constraint = model<IConstraint>(COLLECTIONS.CONSTRAINT, ConstraintSchema);


