import { Calendar } from "@/app/(main)/calendars/models/calendar.model";
import { Grant } from "../../models/grant.model";
import { AllocationStatus } from "./grant.allocation.state-machine";


export type GrantAllocation = {
    _id?: string;
    grant: string | Grant;
    calendar: string | Calendar;
    totalBudget: number;
    usedBudget?: number;
    status?: AllocationStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetGrantAllocationsDTO {
    grant?: string | Grant;
    calendar?: string | Calendar;
    status?:AllocationStatus;
    populate?: boolean;
};

/**
 * Validate allocation fields before submission
 */
export const validateGrantAllocation = (allocation: GrantAllocation): { valid: boolean; message?: string } => {
    if (!allocation.grant) {
        return { valid: false, message: "Grant reference is required." };
    }

    if (!allocation.calendar) {
        return { valid: false, message: "Calendar reference is required." };
    }

    if (allocation.totalBudget === undefined || allocation.totalBudget < 0) {
        return { valid: false, message: "Total budget must be a non-negative number." };
    }

    return { valid: true };
};

/**
 * Prepare allocation object for backend submission
 */
export const sanitizeGrantAllocation = (allocation: Partial<GrantAllocation>): Partial<GrantAllocation> => ({
    ...allocation,
    grant:
        typeof allocation.grant === "object" && allocation.grant !== null
            ? (allocation.grant as any)._id
            : allocation.grant,
    calendar:
        typeof allocation.calendar === "object" && allocation.calendar !== null
            ? (allocation.calendar as Calendar)._id
            : allocation.calendar,
});

/**
 * Create an empty allocation object with defaults
 */
export const createEmptyGrantAllocation = (allocation?: Partial<GrantAllocation>): GrantAllocation => ({
    grant: allocation?.grant ?? "",
    calendar: allocation?.calendar ?? "",
    totalBudget: 0,
    usedBudget: 0
});