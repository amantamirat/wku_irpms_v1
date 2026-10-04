import mongoose from "mongoose";
import { EquipmentUnit, PhaseEquipmentStatus } from "./phase-equipment.model";

export interface PhaseEquipmentDto {
    itemName: string;

    description: string;

    unit: EquipmentUnit;

    // optional: amount of `unit` in ONE purchasable pack
    // (e.g. 0.5 for a 500g pack in kg). Defaults to 1 (sold per unit).
    // Must be greater than 0.
    packSize?: number;

    // optional: price of ONE pack. Defaults to 0 (organization-owned materials)
    unitPrice?: number;

    // number of packs
    quantity: number;

    requiredBy?: Date;

    createdBy?: string;

    status?: PhaseEquipmentStatus;
}

export interface CreatePhaseEquipmentDto extends PhaseEquipmentDto {
    phase: string;
}

export interface UpdatePhaseEquipmentDto {
    id: string;

    data: {
        itemName?: string;
        description?: string;
        unit?: EquipmentUnit;
        unitPrice?: number;
        packSize?: number;
        quantity?: number;
        requiredBy?: Date;
        updatedBy?: string;
    };
}

export interface UpdatePhaseEquipmentStatusDto {
    id: string;

    status: PhaseEquipmentStatus;

    // required when status is refused or cancelled
    reason?: string;
}

export interface FilterPhaseEquipments {
    phase?: string | mongoose.Types.ObjectId;

    status?: PhaseEquipmentStatus;
}