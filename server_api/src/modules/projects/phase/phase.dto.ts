
import { PhaseType } from "./phase.enum";

export interface PhaseDto {
    activity: string;
    duration: number;
    budget: number;
    description?: string;
}

// ---------- CREATE DTO ----------
export interface CreatePhaseDto extends PhaseDto {
    type: PhaseType.phase;
    project: string;
    applicantId: string; // actor performing the operation
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
    project: string;
}


