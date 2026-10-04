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

    itemName: string;

    description: string;

    unit: EquipmentUnit;

    // Amount of `unit` contained in ONE purchasable pack (e.g. 0.5 for a 500g pack in kg).
    // Defaults to 1 when the item is sold per unit.
    packSize: number;

    // Price of ONE pack (0 for materials owned by the organization)
    unitPrice: number;

    // Number of packs
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

        itemName: {
            type: String,
            required: true,
            trim: true,
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

        // Amount of `unit` contained in ONE purchasable pack
        // (e.g. 0.5 for a 500g pack in kg). Defaults to 1 for per-unit items.
        packSize: {
            type: Number,
            min: [0.000001, "packSize must be greater than 0"],
            default: 1,
            required: true,
        },

        // Price of ONE pack (0 for materials owned by the organization)
        unitPrice: {
            type: Number,
            min: 0,
            default: 0,
            required: true,
        },

        // Number of packs
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

// Total cost = price per pack × number of packs
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