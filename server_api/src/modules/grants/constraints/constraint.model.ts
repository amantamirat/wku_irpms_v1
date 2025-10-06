import mongoose, { model, Schema } from "mongoose";
import { ConstraintType, OperationMode } from "./constraint.enum";
import { COLLECTIONS } from "../../../enums/collections.enum";

export interface IConstraint extends Document {
    grant?: mongoose.Types.ObjectId; //
    type?: ConstraintType;
    max?: number;
    min?: number;
    parent?: mongoose.Types.ObjectId; //
    mode?: OperationMode; //
    valueType?: string;
    value?: string;  // String or ObjectIds (stored as string)    
    createdAt?: Date;
    updatedAt?: Date;
}

const ConstraintSchema = new Schema<IConstraint>(
    {
        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
            //required: true,
            immutable: true,
        },
        type: {
            type: String,
            enum: Object.values(ConstraintType),
            //required: true,
            immutable: true,
        },
        max: {
            type: Number,
        },
        min: {
            type: Number,
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
        valueType: {
            type: String,
        },
        value: {
            type: String,
        },

    },
    {
        timestamps: true
    }
);

export const Constraint = model<IConstraint>(COLLECTIONS.CONSTRAINT, ConstraintSchema);

