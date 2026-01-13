import { PhaseStatus } from "./phase.status";

export interface PhaseDto {
    activity: string;
    duration: number;
    budget: number;
    description?: string;
}

// ---------- CREATE DTO ----------
export interface CreatePhaseDto extends PhaseDto {
    project: string;
    applicantId?: string; // actor performing the operation
}

// ---------- UPDATE DTO ----------
export interface UpdatePhaseDto {
    id: string;
    data: Partial<{
        activity: string;
        duration: number;
        budget: number;
        description?: string;
        status: PhaseStatus;
    }>;
    applicantId: string;
}

// ---------- GET_OPTIONS ----------
export interface GetPhasesOptions {
    project: string;
}

//------
export interface UpdatePhaseStatusDto {
    id: string;
    status: PhaseStatus;
    applicantId: string;
}


