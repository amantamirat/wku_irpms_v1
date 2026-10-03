import { Phase } from "../../models/phase.model";

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

export type PhaseEquipment = {
    _id?: string;
    phase: string | Phase;
    itemName: string;
    description: string;
    unit: EquipmentUnit;
    unitPrice?: number;
    quantity: number;
    requiredBy?: Date;
    status?: PhaseEquipmentStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface FilterPhaseEquipmentOptions {
    phase?: string | Phase;
    status?: PhaseEquipmentStatus;
}

// --- Validation Logic ---
export const validatePhaseEquipment = (equipment: PhaseEquipment): { valid: boolean; message?: string } => {
    if (!equipment.phase) {
        return { valid: false, message: 'Phase is required.' };
    }

    if (!equipment.itemName || equipment.itemName.trim() === '') {
        return { valid: false, message: 'Item name is required.' };
    }

    if (!equipment.description || equipment.description.trim() === '') {
        return { valid: false, message: 'Equipment description is required.' };
    }

    if (!equipment.unit || !Object.values(EquipmentUnit).includes(equipment.unit)) {
        return { valid: false, message: 'A valid unit is required.' };
    }

    if (equipment.quantity === undefined || equipment.quantity === null || equipment.quantity <= 0) {
        return { valid: false, message: 'Quantity must be greater than zero.' };
    }

    if (equipment.unitPrice !== undefined && equipment.unitPrice !== null && equipment.unitPrice < 0) {
        return { valid: false, message: 'Unit price cannot be negative.' };
    }

    return { valid: true };
};