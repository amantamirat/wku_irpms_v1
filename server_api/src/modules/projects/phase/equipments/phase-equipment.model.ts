import mongoose, { Document, Schema } from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../../common/schemas/status-history.schema";

export enum EquipmentUnit {
    number = "number",
    meter = "meter",
    liter = "liter",
    kilogram = "kilogram",
}

export enum PhaseEquipmentStatus {
    planned = "planned",
    approved = "approved",
    refused = "refused",
    delivered = "delivered",
    cancelled = "cancelled",
}

export const equipmentTransitions: Record<PhaseEquipmentStatus, PhaseEquipmentStatus[]> = {
    [PhaseEquipmentStatus.planned]: [
        PhaseEquipmentStatus.approved,
        PhaseEquipmentStatus.refused,
        PhaseEquipmentStatus.cancelled,
    ],
    [PhaseEquipmentStatus.approved]: [
        PhaseEquipmentStatus.delivered,
        PhaseEquipmentStatus.cancelled,
        PhaseEquipmentStatus.planned, // send back for re-review
    ],
    [PhaseEquipmentStatus.refused]: [
        PhaseEquipmentStatus.planned, // resubmit
    ],
    [PhaseEquipmentStatus.delivered]: [
        PhaseEquipmentStatus.approved, // correction (marked delivered by mistake)
    ],
    [PhaseEquipmentStatus.cancelled]: [
        PhaseEquipmentStatus.planned, // reopen
    ],
};

export interface IPhaseEquipment extends Document {
    _id: mongoose.Types.ObjectId;

    phase: mongoose.Types.ObjectId;

    description: string;

    unit: EquipmentUnit;

    // 0 for materials owned by the organization
    unitPrice: number;

    quantity: number;

    requiredBy?: Date;

    status: PhaseEquipmentStatus;
    statusHistory: IStatusHistory<PhaseEquipmentStatus>[];

    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;

    // virtual
    totalCost: number;
}

const PhaseEquipmentSchema = new Schema<IPhaseEquipment>(
    {
        phase: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PHASE,
            required: true,
            immutable: true,
            index: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        unit: {
            type: String,
            enum: Object.values(EquipmentUnit),
            default: EquipmentUnit.number,
            required: true,
        },

        unitPrice: {
            type: Number,
            min: 0,
            default: 0,
            required: true,
        },

        quantity: {
            type: Number,
            min: 0,
            required: true,
        },

        requiredBy: {
            type: Date,
        },

        status: {
            type: String,
            enum: Object.values(PhaseEquipmentStatus),
            default: PhaseEquipmentStatus.planned,
            required: true,
        },

        statusHistory: {
            type: [createStatusHistorySchema(
                Object.values(PhaseEquipmentStatus)
            )],
            default: [],
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

PhaseEquipmentSchema.virtual("totalCost").get(function (this: IPhaseEquipment) {
    return (this.unitPrice ?? 0) * (this.quantity ?? 0);
});

PhaseEquipmentSchema.index({
    phase: 1,
    description: 1,
});

PhaseEquipmentSchema.index({
    phase: 1,
    status: 1,
});

export const PhaseEquipment = mongoose.model<IPhaseEquipment>(
    COLLECTIONS.PHASE_EQUIPMENT,
    PhaseEquipmentSchema
);