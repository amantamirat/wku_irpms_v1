import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";


export interface IConstraint extends Document {
    name: string;
    description?: string;

    minParticipants?: number;
    maxParticipants?: number;

    minPhases?: number;
    maxPhases?: number;

    minBudget?: number;
    maxBudget?: number;

    minDuration?: number;
    maxDuration?: number;

    minBudgetPerPhase?: number;
    maxBudgetPerPhase?: number;

    minDurationPerPhase?: number;
    maxDurationPerPhase?: number;

    minThemes?: number;
    maxThemes?: number;

    minSubThemes?: number;
    maxSubThemes?: number;

    minFocusAreas?: number;
    maxFocusAreas?: number;

    minIndicators?: number;
    maxIndicators?: number;

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

        minParticipants: {
            type: Number,
            min: 0,
        },
        maxParticipants: {
            type: Number,
            min: 0,
        },

        minPhases: {
            type: Number,
            min: 0,
        },
        maxPhases: {
            type: Number,
            min: 0,
        },

        minBudget: {
            type: Number,
            min: 0,
        },
        maxBudget: {
            type: Number,
            min: 0,
        },

        minDuration: {
            type: Number,
            min: 0,
        },
        maxDuration: {
            type: Number,
            min: 0,
        },

        minBudgetPerPhase: {
            type: Number,
            min: 0,
        },
        maxBudgetPerPhase: {
            type: Number,
            min: 0,
        },

        minDurationPerPhase: {
            type: Number,
            min: 0,
        },
        maxDurationPerPhase: {
            type: Number,
            min: 0,
        },

        minThemes: {
            type: Number,
            min: 0,
        },
        maxThemes: {
            type: Number,
            min: 0,
        },

        minSubThemes: {
            type: Number,
            min: 0,
        },
        maxSubThemes: {
            type: Number,
            min: 0,
        },

        minFocusAreas: {
            type: Number,
            min: 0,
        },
        maxFocusAreas: {
            type: Number,
            min: 0,
        },

        minIndicators: {
            type: Number,
            min: 0,
        },
        maxIndicators: {
            type: Number,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

export const Constraint = mongoose.model<IConstraint>(
    COLLECTIONS.CONSTRAINT, ConstraintSchema);