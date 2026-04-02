import { CallStatus } from "./call.status";

export interface CreateCallDTO {
    grantAllocation: string;
    title: string;
    description?: string;
    status?: CallStatus;
    userId?: string;
}

// Base fields for updating any call
export interface UpdateCallDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
    }>;
    userId?: string;
}

// Options for querying calls
export interface GetCallsOptions {
    grantAllocation?: string;
    calendar?: string;
    grant?: string;
    status?: CallStatus;
    populate?: boolean;
}

export interface ExistsCallDTO {
    grantAllocation?: string;
}
