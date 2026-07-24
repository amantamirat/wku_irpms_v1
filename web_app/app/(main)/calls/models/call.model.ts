import { Calendar } from "../../calendars/models/calendar.model";
import { GrantAllocation } from "../../grants/allocations/models/grant.allocation.model";
import { Grant } from "../../grants/models/grant.model";
import { GrantStage } from "../../grants/stages/models/grant.stage.model";
import { Organization } from "../../organizations/models/organization.model";

export enum CallStatus {
    planned = "planned",
    active = "active",
    closed = "closed"
}

/*
export type CallDeadline = {
    grantStage: string | GrantStage;
    submission: string | Date;
    evaluation: string | Date;
};*/

// 2. Update your main Call type
export type Call = {
    _id?: string;
    grant: string | Grant; // The new single source of truth
    calendar?: string | Calendar;
    organization?: string | Organization;
    title: string;
    //allocatedBudget?: number;
    //usedBudget?: number;
    description?: string | null;
    deadline?: Date;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetCallsOptions {
    status?: CallStatus;
    calendar?: string;
    grant?: string;
    populate?: boolean;
}

export const validateCall = (call: Call): { valid: boolean; message?: string } => {
    if (!call.title || call.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (!call.grant) {
        return { valid: false, message: "Grant  is required." };
    }
    if (!call.calendar) {
        return { valid: false, message: "Call Year is required." };
    }
    if (!call.status) {
        return { valid: false, message: "Status is required." };
    }
    return { valid: true };
};

export const sanitizeCall = (call: Partial<Call>): Partial<Call> => {
    const sanitized: any = { ...call };

    if (typeof sanitized.grant === "object" && sanitized.grant !== null) {
        sanitized.grant = sanitized.grant._id;
    }

    if (typeof sanitized.calendar === "object" && sanitized.calendar !== null) {
        sanitized.calendar = sanitized.calendar._id;
    }

    if (typeof sanitized.organization === "object" && sanitized.organization !== null) {
        sanitized.organization = sanitized.organization._id;
    }

    if (Array.isArray(sanitized.deadlines)) {
        sanitized.deadlines = sanitized.deadlines.map((deadline: any) => ({
            ...deadline,
            grantStage:
                typeof deadline.grantStage === "object" &&
                    deadline.grantStage !== null
                    ? deadline.grantStage._id
                    : deadline.grantStage
        }));
    }

    if (sanitized.description === "") {
        sanitized.description = null;
    }

    return sanitized as Partial<Call>;
};


export const createEmptyCall = (call?: Partial<Call>): Call => ({
    title: "",
    status: CallStatus.planned,
    grant: call?.grant ?? '',
    description: ""
});