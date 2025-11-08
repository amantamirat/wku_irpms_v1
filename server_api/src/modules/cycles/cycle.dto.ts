import mongoose from "mongoose";
import { CycleStatus, CycleType } from "./cycle.d";

// Base fields for creating any cycle
export interface CreateCycleDto {
    calendar: mongoose.Types.ObjectId;
    grant: mongoose.Types.ObjectId;
    organization: mongoose.Types.ObjectId; // immutable
    //center?: mongoose.Types.ObjectId; // immutable
    title: string;
    description?: string;
    theme?: mongoose.Types.ObjectId;
    type: CycleType;
    status?: CycleStatus;
    userId: string;
}

// Base fields for updating any cycle
export interface UpdateCycleDto {
    id: string | mongoose.Types.ObjectId;
    data: Partial<{
        title: string;
        description: string;
        theme: mongoose.Types.ObjectId;
        status: CycleStatus;
    }>;
    userId: string;
}

// Options for querying cycles
export interface GetCyclesOptions {
    userId?: string;
    calendar?: mongoose.Types.ObjectId;
    grant?: mongoose.Types.ObjectId;
    type?: CycleType;
    status?: CycleStatus;
}

// Delete DTO
export interface DeleteCycleDto {
    id: string | mongoose.Types.ObjectId;
    userId: string;
}




