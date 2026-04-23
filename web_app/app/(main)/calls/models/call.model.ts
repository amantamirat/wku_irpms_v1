import { Calendar } from "../../calendars/models/calendar.model";
import { GrantAllocation } from "../../grants/allocations/models/grant.allocation.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";

export enum CallStatus {
    planned = "planned",
    active = "active",
    closed = "closed"
}

export type Call = {
    _id?: string;
    grantAllocation: string | GrantAllocation; // The new single source of truth
    organization?: string | Organization;
    title: string;
    description?: string | null;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetCallsOptions {
    grantAllocation?: string;
    status?: CallStatus;
    calendar?: string;
    grant?: string;
    populate?: boolean;
}

export const validateCall = (call: Call): { valid: boolean; message?: string } => {
    if (!call.title || call.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (!call.grantAllocation) {
        return { valid: false, message: "Grant Allocation (Year/Grant) is required." };
    }
    if (!call.status) {
        return { valid: false, message: "Status is required." };
    }
    return { valid: true };
};

export const sanitizeCall = (call: Partial<Call>): Partial<Call> => {
    const sanitized: any = { ...call };


    if (typeof sanitized.grantAllocation === "object" && sanitized.grantAllocation !== null) {
        sanitized.grantAllocation = sanitized.grantAllocation._id;
    }

    if (typeof sanitized.organization === "object" && sanitized.organization !== null) {
        sanitized.organization = sanitized.organization._id;
    }

    // 3. Ensure optional fields are handled correctly
    if (sanitized.description === "") {
        sanitized.description = null;
    }

    return sanitized as Partial<Call>;
};


export const createEmptyCall = (call?: Partial<Call>): Call => ({
    title: "",
    status: CallStatus.planned,
    grantAllocation: call?.grantAllocation ?? '',
    description: ""
});