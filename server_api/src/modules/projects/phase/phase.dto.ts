import mongoose from "mongoose";

// 2. Base Phase structure
export interface PhaseDto {
    //_id?: string | mongoose.Types.ObjectId;
    duration: number;        // Total duration of the phase
    budget: number;          // Total budget of the phase
    startDate: Date;
    endDate: Date;
}

// ---------- CREATE DTO ----------
export interface CreatePhaseDto extends PhaseDto {
    project: string;         // Hex String ID
}

// ---------- UPDATE DTO ----------
export interface UpdatePhaseDto extends Partial<PhaseDto> {
}

// ---------- GET_OPTIONS ----------
export interface FilterPhases {
    project: string;
}