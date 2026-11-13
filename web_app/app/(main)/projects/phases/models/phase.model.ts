import { IStatusHistory } from "@/components/StatusHistoryWidget";
import { Project } from "../../models/project.model";

export enum PhaseStatus {
    proposed = 'proposed',
    approved = 'approved',
    refused = 'refused',
    active = 'active',
    completed = 'completed',
    cancelled = 'cancelled',
}

export type Phase = {
    _id?: string;
    project?: string | Project;
    title?: string;
    order?: number;//optional
    duration: number;           // Total duration
    budget: number;             // Total budget
    description?: string;       // Optional

    startDate?: Date | null;
    endDate?: Date | null;

    status?: PhaseStatus;
    statusHistory?: IStatusHistory<PhaseStatus>[];
    createdAt?: Date;
    updatedAt?: Date;
};

export interface FilterPhasesOptions {
    project?: string | Project;
}