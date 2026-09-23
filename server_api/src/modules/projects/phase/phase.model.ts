import mongoose, { model, Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../common/schemas/status-history.schema";

export enum PhaseStatus {
    proposed = 'proposed',
    approved = 'approved',
    refused = 'refused',
    active = 'active',
    completed = 'completed',
    terminated = 'terminated',
}


export interface IPhase extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    order: number;
    title: string;
    duration: number;
    startDate?: Date;
    endDate?: Date;
    budget: number;
    description?: string;
    status: PhaseStatus;
    statusHistory: IStatusHistory<PhaseStatus>[];
    createdAt?: Date;
    updatedAt?: Date;
}




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
        },
        statusHistory: {
            type: [createStatusHistorySchema(Object.values(PhaseStatus))],
            default: []
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

PhaseSchema.index({ project: 1, order: 1 }, { unique: true });

export const Phase = model<IPhase>(COLLECTIONS.PHASE, PhaseSchema);
