import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum ConstraintType {
    PARTICIPANT = "PARTICIPANT",
    PHASE_COUNT = "PHASE-COUNT",
    BUDGET_TOTAL = "BUDGET-TOTAL",
    TIME_TOTAL = "TIME-TOTAL",
    BUDGET_PHASE = "BUDGET-PHASE",
    TIME_PHASE = "TIME-PHASE",
    THEME = "THEME",
    SUB_THEME = "SUB_THEME",
    FOCUS_AREA = "FOCUS_AREA",
    INDICATOR = "INDICATOR",
    PROJECT_TITLE = "PROJECT_TITLE",
    PROJECT_SUMMARY = "PROJECT_SUMMARY"
}

export interface IConstraint extends Document {
    grant: mongoose.Types.ObjectId;
    constraint: ConstraintType;
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
            enum: Object.values(ConstraintType),
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



