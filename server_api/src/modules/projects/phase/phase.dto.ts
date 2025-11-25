import mongoose from "mongoose";
import { PhaseType } from "./phase.enum";

// ---------- CREATE DTO ----------
export interface CreatePhaseDto {
    // type: PhaseType; // "phase" | "breakdown"
    type: PhaseType.phase;
    activity: string;
    duration: number;
    budget: number;
    description?: string;

    // For Phase type
    project: string;

    // For Breakdown type
    parent?: string;

    userId: string; // actor performing the operation
}

// ---------- UPDATE DTO ----------
export interface UpdatePhaseDto {
    id: string;
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
    //type?: PhaseType;
    project: string;
    //parent?: mongoose.Types.ObjectId;
    //userId?: string;
}

// ---------- DELETE DTO ----------
export interface DeletePhaseDto {
    id: string | mongoose.Types.ObjectId;
    userId: string;
}
