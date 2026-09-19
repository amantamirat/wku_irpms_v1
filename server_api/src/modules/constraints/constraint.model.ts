import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { IRange } from "../../common/types/range";
import { RangeSchema } from "../../common/schemas/range.schema";

export interface IConstraint extends Document {
    name: string;
    description?: string;

    titleWords?: IRange;
    summaryWords?: IRange;

    participants?: IRange;
    phases?: IRange;

    budget?: IRange;
    duration?: IRange;

    budgetPerPhase?: IRange;
    durationPerPhase?: IRange;

    themes?: IRange;
    subThemes?: IRange;

    focusAreas?: IRange;
    indicators?: IRange;

    createdAt?: Date;
    updatedAt?: Date;
}

const ConstraintSchema = new Schema<IConstraint>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        description: {
            type: String,
            trim: true,
        },

        titleWords: {
            type: RangeSchema,
        },

        summaryWords: {
            type: RangeSchema,
        },

        participants: {
            type: RangeSchema,
        },

        phases: {
            type: RangeSchema,
        },

        budget: {
            type: RangeSchema,
        },

        duration: {
            type: RangeSchema,
        },

        budgetPerPhase: {
            type: RangeSchema,
        },

        durationPerPhase: {
            type: RangeSchema,
        },

        themes: {
            type: RangeSchema,
        },

        subThemes: {
            type: RangeSchema,
        },

        focusAreas: {
            type: RangeSchema,
        },

        indicators: {
            type: RangeSchema,
        },
    },
    {
        timestamps: true,
    }
);

export const Constraint = mongoose.model<IConstraint>(
    COLLECTIONS.CONSTRAINT,
    ConstraintSchema
);