import mongoose from "mongoose";
import { EquipmentUnit, PhaseEquipmentStatus } from "./phase-equipment.model";

export interface EquipmentDto {
    itemName: string;

    description: string;

    unit: EquipmentUnit;

    // optional: amount of `unit` in ONE purchasable pack
    // (e.g. 0.5 for a 500g pack in kg). Defaults to 1 (sold per unit).
    // Must be greater than 0.
    packSize?: number;

    // optional: price of ONE pack. Defaults to 0 (organization-owned materials)
    unitPrice: number;

    // number of packs
    quantity: number;

    requiredBy?: Date;

    createdBy?: string;

    status?: PhaseEquipmentStatus;
}

export interface CreatePhaseEquipmentDto extends EquipmentDto {
    project: string;
    phase?: string;
}

export interface UpdatePhaseEquipmentDto {
    id: string;

    data: {
        phase?: string;
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



export interface FilterPhaseEquipments {
    project?: string | mongoose.Types.ObjectId;
    phase?: string | mongoose.Types.ObjectId;
    status?: PhaseEquipmentStatus;
}