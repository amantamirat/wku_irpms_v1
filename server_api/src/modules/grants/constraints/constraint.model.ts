import mongoose, { model, Schema } from "mongoose";
import { ApplicantConstraint, ConstraintType, OperationMode } from "./constraint.enum";
import { COLLECTIONS } from "../../../enums/collections.enum";

export interface IBaseConstraint extends Document {
    type: ConstraintType;
    grant: mongoose.Types.ObjectId;
    parent?: mongoose.Types.ObjectId; //
    mode?: OperationMode; //
    value?: string;  // String or ObjectIds (stored as string)
    max?: number;
    min?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const BaseConstraintSchema = new Schema<IBaseConstraint>(
    {
        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
            required: true,
            immutable: true,
        },
        type: {
            type: String,
            enum: Object.values(ApplicantConstraint),
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
        timestamps: true, discriminatorKey: "type"
    }
);

export const Constraint = model<IBaseConstraint>(COLLECTIONS.CONSTRAINT, BaseConstraintSchema);