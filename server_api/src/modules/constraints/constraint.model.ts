import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { IRange } from "../../common/types/range";
import { RangeSchema } from "../../common/schemas/range.schema";

export interface IConstraint extends Document {
    name: string;
    description?: string;

    titleWords?: IRange;
    summaryWords?: IRange;
    keyWords?: IRange;

    // Objectives
    generalObjectiveWords?: IRange;
    specificObjectiveWords?: IRange;
    specificObjectives?: IRange;

    // Expected Outputs
    expectedOutputs?: IRange;
    expectedOutputWords?: IRange;

    // Project structure
    participants?: IRange;
    phases?: IRange;
    budget?: IRange;
    duration?: IRange;

    activities?: IRange;
    equipments?: IRange;

    components?: IRange;
    componentCollaborators?: IRange;

    phaseBudget?: IRange;
    phaseDuration?: IRange;

    activityCost?: IRange;
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

        keyWords: {
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

        components: {
            type: RangeSchema,
        },

        componentCollaborators: {
            type: RangeSchema,
        },

        phaseBudget: {
            type: RangeSchema,
        },

        phaseDuration: {
            type: RangeSchema,
        },

        activityCost: {
            type: RangeSchema,
        },

        activityDuration: {
            type: RangeSchema,
        },

        equipmentCost: {
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