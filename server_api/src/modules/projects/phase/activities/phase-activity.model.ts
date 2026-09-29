import mongoose, { Document, Schema } from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../../common/schemas/status-history.schema";

export enum PhaseActivityStatus {
    planned = "planned",
    approved = 'approved',
    refused = 'refused',
    active = "active",
    completed = "completed",
    cancelled = "cancelled",
}

export interface IPhaseActivity extends Document {
    _id: mongoose.Types.ObjectId;

    phase: mongoose.Types.ObjectId;

    title: string;
    description?: string;

    participants?: number;
    //requiredDays?: number;
    cost?: number;

    startDate: Date;
    endDate: Date;

    status: PhaseActivityStatus;
    statusHistory: IStatusHistory<PhaseActivityStatus>[];

    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;
}

const PhaseActivitySchema = new Schema<IPhaseActivity>(
    {
        phase: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PHASE,
            required: true,
            immutable: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        participants: {
            type: Number,
            min: 0,
        },

        /*
        requiredDays: {
            type: Number,
            min: 0,
        },*/

        cost: {
            type: Number,
            min: 0,
            required: true,
        },

        startDate: {
            type: Date,
        },

        endDate: {
            type: Date,
        },

        status: {
            type: String,
            enum: Object.values(PhaseActivityStatus),
            default: PhaseActivityStatus.planned,
            required: true,
        },

        statusHistory: {
            type: [createStatusHistorySchema(
                Object.values(PhaseActivityStatus)
            )],
            default: []
        },


        createdBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER
        }
    },
    {
        timestamps: true,
    }
);

PhaseActivitySchema.index({
    phase: 1,
    title: 1,
});

export const PhaseActivity = mongoose.model<IPhaseActivity>(
    COLLECTIONS.PHASE_ACTIVITY,
    PhaseActivitySchema
);