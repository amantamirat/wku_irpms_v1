import mongoose from "mongoose";
import { EquipmentUnit, PhaseEquipmentStatus } from "./phase-equipment.model";

export interface CreatePhaseEquipmentDto {
    phase: string;

    description: string;

    unit: EquipmentUnit;

    // optional: defaults to 0 (organization-owned materials)
    unitPrice?: number;

    quantity: number;

    requiredBy?: Date;

    createdBy?: string;
}

export interface UpdatePhaseEquipmentDto {
    id: string;

    data: {
        description?: string;
        unit?: EquipmentUnit;
        unitPrice?: number;
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