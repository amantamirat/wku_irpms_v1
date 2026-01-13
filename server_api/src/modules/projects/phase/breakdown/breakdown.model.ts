import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export interface BreakdownDocument extends Document {
    _id: mongoose.Types.ObjectId;
    phase: mongoose.Types.ObjectId;
    activity: string;
    duration: number;
    budget: number;
    description: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const BreakdownSchema = new Schema<BreakdownDocument>(
    {
        phase: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PHASE,
            required: true
        },
        activity: {
            type: String,
            required: true,
            trim: true
        },
        duration: {
            type: Number,
            min: 0,
            required: true
        },
        budget: {
            type: Number,
            min: 0,
            required: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const Breakdown = model<BreakdownDocument>(
    COLLECTIONS.BREAKDOWN, BreakdownSchema
);