import { PhaseStatus } from "./phase.status";

// 1. New Breakdown DTO for the array items
export interface PhaseBreakdownDto {
    activity: string;
    duration: number;
    budget: number;
}

// 2. Base Phase structure
export interface PhaseDto {
    order: number;           // Added: critical for the unique index {project, order}
    duration: number;        // Total duration of the phase
    budget: number;          // Total budget of the phase
    description?: string;
    breakdown?: PhaseBreakdownDto[]; // Added: the array of details
}

// ---------- CREATE DTO ----------
export interface CreatePhaseDto extends PhaseDto {
    project: string;         // Hex String ID
    applicantId: string;     // Made required: needed for authorization check
}

// ---------- UPDATE DTO ----------
export interface UpdatePhaseDto {
    id: string;              // The Phase ID
    applicantId: string;
    data: Partial<{
        order: number;
        duration: number;
        budget: number;
        description: string;
        breakdown: PhaseBreakdownDto[]; // Allows updating the whole array
    }>;
}

// ---------- GET_OPTIONS ----------
export interface GetPhasesOptions {
    project: string;
    populate?: boolean;
}