import mongoose, { model, Schema } from "mongoose";
import { PhaseType } from "./phase.enum";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { PhaseStatus } from "./phase.status";

interface BasePhaseDocument extends Document {
    _id: mongoose.Types.ObjectId;
    type: PhaseType;
    activity: string;
    duration: number; //proposed duration
    budget: number; //proposed budget
    reviewedDuration?: number;
    reviewedBudget?: number;
    description?: string;
    status: PhaseStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const BasePhaseSchema = new Schema<BasePhaseDocument>(
    {
        type: {
            type: String,
            enum: Object.values(PhaseType),
            required: true,
            immutable: true
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
        reviewedDuration: {
            type: Number,
            min: 0
        },
        reviewedBudget: {
            type: Number,
            min: 0
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
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

export const BasePhase = model<BasePhaseDocument>(COLLECTIONS.PHASE, BasePhaseSchema);

export interface IPhase extends BasePhaseDocument {
    type: PhaseType.phase;
    project: mongoose.Types.ObjectId;
}

const PhaseSchema = new Schema<IPhase>({
    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
        required: true,
    }
});

export const Phase = BasePhase.discriminator<IPhase>(PhaseType.phase, PhaseSchema);

interface BreakdownDocument extends BasePhaseDocument {
    type: PhaseType.breakdown;
    parent: mongoose.Types.ObjectId;
}

const BreakdownSchema = new Schema<BreakdownDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: Phase.modelName,
        required: true,
    }
});

export const Breakdown = BasePhase.discriminator<BreakdownDocument>(PhaseType.breakdown, BreakdownSchema);
