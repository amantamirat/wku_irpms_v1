import { CallStatus } from "./call.model";
import { CreateStageDTO } from "./stages/stage.dto";


export interface CreateCallDTO {
    grant: string;
    organization?: string;
    calendar: string;
    title: string;
    constraint?: string;
    composition?: string;
    description?: string;
    stages?: CreateStageDTO[];
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
        constraint: string;
        composition: string;
        deadline: Date | null;
    }>;
    userId?: string;
}

// Options for querying calls
export interface FilterCallDTO {
    calendar?: string;
    grant?: string;
    status?: CallStatus;
    //populate?: boolean;
}

