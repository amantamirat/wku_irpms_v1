import mongoose from "mongoose";
import { AllocationStatus } from "./grant.allocation.model";

export interface GetGrantAllocationsDTO {
    grant?: string;
    calendar?: string;
    status?: AllocationStatus;
    populate?: boolean;
}

export interface CreateGrantAllocationDTO {
    grant: string;        // ObjectId as string
    calendar: string;     // ObjectId as string
    allocatedAmount: number;
}

export interface UpdateGrantAllocationDTO {
    id: string;
    data: Partial<{
        allocatedAmount: number;
    }>;
    userId?: string;
}

export interface ExistsGrantAllocationDTO {
    grant?: string;
    calendar?: string;
    status?: AllocationStatus;
}