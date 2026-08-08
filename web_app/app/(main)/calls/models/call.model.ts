import { Calendar } from "../../calendars/models/calendar.model";
import { Composition } from "../../compositions/models/composition.model";
import { Constraint } from "../../constraints/models/constraint.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";

export enum CallStatus {
    planned = "planned",
    active = "active",
    closed = "closed"
}


export type Call = {
    _id?: string;
    grant?: string | Grant; // The new single source of truth
    calendar?: string | Calendar;
    organization?: string | Organization;
    title?: string;
    constraint?: string | Constraint;
    composition?: string | Composition;
    description?: string | null;
    deadline?: Date;
    status?: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetCallsOptions {
    status?: CallStatus;
    calendar?: string;
    grant?: string;
    populate?: boolean;
}

export const validateCall = (call: Partial<Call>): { valid: boolean; message?: string } => {
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

export function sanitizeCall(call: Partial<Call>): Partial<Call> {
    return {
        ...call,

        grant:
            typeof call.grant === "object" && call.grant !== null
                ? call.grant._id
                : call.grant,

        calendar:
            typeof call.calendar === "object" && call.calendar !== null
                ? call.calendar._id
                : call.calendar,

        organization:
            typeof call.organization === "object" && call.organization !== null
                ? call.organization._id
                : call.organization,

        constraint:
            typeof call.constraint === "object" && call.constraint !== null
                ? call.constraint._id
                : call.constraint,

        composition:
            typeof call.composition === "object" && call.composition !== null
                ? call.composition._id
                : call.composition,
        description: call.description === "" ? null : call.description,
    };
}


export const createEmptyCall = (call?: Partial<Call>): Call => ({
    title: "",
    status: CallStatus.planned,
    grant: call?.grant ?? '',
    description: ""
});