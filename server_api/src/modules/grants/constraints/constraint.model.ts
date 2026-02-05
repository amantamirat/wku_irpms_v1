import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum ConstraintType {
    PROJECT = "project",
    APPLICANT = "applicant",
    //COMPOSITION = "Composition"
}

export interface IConstraint extends Document {
    grant: mongoose.Types.ObjectId;
    type: ConstraintType;
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
        type: {
            type: String,
            enum: Object.values(ConstraintType),
            required: true,
            immutable: true,
        }
    },
    {
        timestamps: true, discriminatorKey: "type"
    }
);


ConstraintSchema.index({ grant: 1, type: 1, constraint: 1 }, { unique: true });
export const Constraint = model<IConstraint>(COLLECTIONS.CONSTRAINT, ConstraintSchema);


