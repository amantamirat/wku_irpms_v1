import { CallStatus } from "./call.model";

export interface FindByIdOptions {
    populate?: {
        grant?: boolean;
    };
}

export interface CallDeadlineDTO {
    submission: string; // ISO date string (e.g., "2026-12-31T23:59:59.000Z")
    evaluation: string; // ISO date string
}

export interface CreateCallDTO {
    grant: string;
    organization?: string;
    calendar: string;
    title: string;
    description?: string;
    budget: number;
    deadlines: CallDeadlineDTO[];
    status?: CallStatus;
    userId?: string;
}

// Base fields for updating any call
export interface UpdateCallDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
        budget: number;
        deadlines: CallDeadlineDTO[];
    }>;
    userId?: string;
}

// Options for querying calls
export interface GetCallsOptions {
    calendar?: string;
    grant?: string;
    status?: CallStatus;
    populate?: boolean;
}

export interface ExistsCallDTO {
    grantAllocation?: string;
}
