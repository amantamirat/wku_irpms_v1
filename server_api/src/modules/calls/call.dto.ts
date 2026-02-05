import { CallStatus } from "./call.status";

export interface CreateCallDTO {
    calendar: string;
    directorate: string;
    grant: string;
    title: string;
    description?: string;
    thematic: string;
    status?: CallStatus;
    userId?: string;
}

// Base fields for updating any call
export interface UpdateCallDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
        thematic: string;
        status: CallStatus;
    }>;
    userId?: string;
}

export interface UpdateCallStatusDTO {
    id: string;
    status: CallStatus;
}

// Options for querying calls
export interface GetCallsOptions {
    calendar?: string;
    directorate?: string;
    status?: CallStatus;
    populate?: boolean;
    userId?: string;
}

export interface ExistsCallDTO {
    grant?: string;
    calendar?: string;
    directorate?: string;
    thematic?: string;
}
