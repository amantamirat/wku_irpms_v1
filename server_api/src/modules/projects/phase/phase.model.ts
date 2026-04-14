import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { PhaseStatus } from "./phase.status";

/*
// 1. Define the Breakdown Interface
export interface IBreakdown {
    activity: string;
    duration: number;
    budget: number;
}
*/

export interface IPhase extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    order: number;
    title: String;
    duration: number;
    startDate?: Date;
    endDate?: Date;
    budget: number;
    description?: string;
    // breakdown: IBreakdown[]; // The new array
    status: PhaseStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

/*
// 2. Define the Sub-schema
const PhaseBreakdownSchema = new Schema<IBreakdown>({
    activity: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 0 },
    budget: { type: Number, required: true, min: 0 }
}, { _id: false }); // Set _id: false if you don't need to reference specific activities
*/
const PhaseSchema = new Schema<IPhase>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PROJECT,
            required: true,
            index: true
        },
        order: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            //required: true
        },
        duration: {
            type: Number,
            min: 0,
            required: true
        },
        startDate: {
            type: Date,
            required: false
        },
        endDate: {
            type: Date,
            required: false
        },
        budget: {
            type: Number,
            min: 0,
            required: true
        },
        description: {
            type: String,
            trim: true
        },
        // breakdown: [PhaseBreakdownSchema], // Embedding the array
        status: {
            type: String,
            enum: Object.values(PhaseStatus),
            default: PhaseStatus.proposed,
            required: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

PhaseSchema.index({ project: 1, order: 1 }, { unique: true });

export const Phase = model<IPhase>(COLLECTIONS.PHASE, PhaseSchema);