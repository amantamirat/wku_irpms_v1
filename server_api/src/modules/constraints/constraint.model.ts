import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { IRange } from "../../common/types/range";
import { RangeSchema } from "../../common/schemas/range.schema";

export interface IConstraint extends Document {
    name: string;
    description?: string;

    titleWords?: IRange;
    summaryWords?: IRange;

    // Objectives
    generalObjectiveWords?: IRange;
    specificObjectiveWords?: IRange;
    specificObjectives?: IRange;

    // Expected Outputs
    expectedOutputs?: IRange;
    expectedOutputWords?: IRange;

    //project structure
    participants?: IRange;
    phases?: IRange;
    budget?: IRange;
    duration?: IRange;

    activities?: IRange;
    equipments?: IRange;
    components?: IRange;

    phaseBudget?: IRange;
    phaseDuration?: IRange;

    activityDuration?: IRange;
    equipmentCost?: IRange;



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

        // Objectives
        generalObjectiveWords: {
            type: RangeSchema,
        },

        specificObjectiveWords: {
            type: RangeSchema,
        },

        specificObjectives: {
            type: RangeSchema,
        },

        // Expected Outputs
        expectedOutputs: {
            type: RangeSchema,
        },

        expectedOutputWords: {
            type: RangeSchema,
        },

        // Project structure
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

        activities: {
            type: RangeSchema,
        },

        equipments: {
            type: RangeSchema,
        },

        components: {                 // ← added
            type: RangeSchema,
        },

        phaseBudget: {
            type: RangeSchema,
        },

        phaseDuration: {
            type: RangeSchema,
        },

        activityDuration: {           // ← added
            type: RangeSchema,
        },

        equipmentCost: {              // ← added
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
