import mongoose from "mongoose";
import { EquipmentUnit, PhaseEquipmentStatus } from "./phase-equipment.model";

export interface EquipmentDto {
    itemName: string;

    description: string;

    unit: EquipmentUnit;
    packSize?: number;
    unitPrice: number;
    quantity: number;
    requiredBy?: Date;
}

export interface CreatePhaseEquipmentDto extends EquipmentDto {
    phase: string;
}

export interface UpdatePhaseEquipmentDto extends Partial<CreatePhaseEquipmentDto> {
    
}



export interface FilterPhaseEquipments {
    project?: string | mongoose.Types.ObjectId;
    phase?: string | mongoose.Types.ObjectId;
    status?: PhaseEquipmentStatus;
}