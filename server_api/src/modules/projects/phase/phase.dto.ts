import mongoose from "mongoose";
import { PhaseType } from "./phase.enum";

// ---------- CREATE DTO ----------
export interface CreatePhaseDto {
    type: PhaseType; // "phase" | "breakdown"
    activity: string;
    duration: number;
    budget: number;
    description?: string;

    // For Phase type
    project?: mongoose.Types.ObjectId;

    // For Breakdown type
    parent?: mongoose.Types.ObjectId;

    userId: string; // actor performing the operation
}

// ---------- UPDATE DTO ----------
export interface UpdatePhaseDto {
    id: string | mongoose.Types.ObjectId;
    data: Partial<{
        activity: string;
        duration: number;
        budget: number;
        description?: string;
    }>;
    userId: string;
}

// ---------- GET / QUERY OPTIONS ----------
export interface GetPhasesOptions {
    type?: PhaseType;
    project?: mongoose.Types.ObjectId;
    parent?: mongoose.Types.ObjectId;
    //userId?: string;
}

// ---------- DELETE DTO ----------
export interface DeletePhaseDto {
    id: string | mongoose.Types.ObjectId;
    userId: string;
}
