import mongoose, { model, Schema } from "mongoose";
import { PhaseType } from "../enums/phase.type.enum";
import { COLLECTIONS } from "../../../enums/collections.enum";

interface BasePhaseDocument extends Document {
    type: PhaseType;
    activity: string;
    duration: number;
    budget: number;
    description?: string;
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
        description: {
            type: String
        },
    },
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

const BasePhase = model<BasePhaseDocument>(COLLECTIONS.PHASE, BasePhaseSchema);

interface PhaseDocument extends BasePhaseDocument {
    type: PhaseType.phase;
    project: mongoose.Types.ObjectId;
}

const PhaseSchema = new Schema<PhaseDocument>({
    project: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.PROJECT,
        required: true,
    }
});

export const Phase = BasePhase.discriminator<PhaseDocument>(PhaseType.phase, PhaseSchema);

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
