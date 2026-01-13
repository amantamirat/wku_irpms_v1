import mongoose, { model, Schema } from "mongoose";
import { PhaseType } from "./phase.enum";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { PhaseStatus } from "./phase.status";

export interface IPhase extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    activity: string;
    duration: number;
    budget: number;
    description?: string;
    status: PhaseStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const PhaseSchema = new Schema<IPhase>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PROJECT,
            required: true
        },
        activity: {
            type: String,
            required: true
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
            type: String
        },
        status: {
            type: String,
            enum: Object.values(PhaseStatus),
            default: PhaseStatus.proposed,
            required: true
        }
    },
    { timestamps: true }
);

export const Phase = model<IPhase>(COLLECTIONS.PHASE, PhaseSchema);







