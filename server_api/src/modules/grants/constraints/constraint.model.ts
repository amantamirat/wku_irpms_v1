import mongoose, { model, Schema } from "mongoose";
import { ConstraintType, OperationMode } from "./constraint.enum";
import { COLLECTIONS } from "../../../enums/collections.enum";

export interface IConstraint extends Document {
    grant: mongoose.Types.ObjectId;
    type: ConstraintType;
    parent?: mongoose.Types.ObjectId;
    mode?: OperationMode;
    value?: string;  // String or ObjectIds (stored as string)
    max?: number;
    min?: number;
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
        },
        parent: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.CONSTRAINT,
            immutable: true,
        },
        mode: {
            type: String,
            enum: Object.values(OperationMode),
        },
        value: {
            type: String,
        },
        max: {
            type: Number,
        },
        min: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

export const Constraint = model<IConstraint>("Constraint", ConstraintSchema);