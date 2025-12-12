import { CallStatus } from "./call.enum";

export interface CreateCallDTO {
    calendar: string;
    directorate: string;
    grant: string;
    title: string;
    description?: string;
    thematic?: string;
    status?: CallStatus;
    userId: string;
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
    userId: string;
}

// Options for querying calls
export interface GetCallsOptions {
    calendar?: string;
    directorate?: string;
    status?: CallStatus;
    userId?: string;
}

