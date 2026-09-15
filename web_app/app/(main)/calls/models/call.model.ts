import { Calendar } from "../../calendars/models/calendar.model";
import { Composition } from "../../compositions/models/composition.model";
import { Constraint } from "../../constraints/models/constraint.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { Stage } from "../stages/models/stage.model";

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
    stages?: Stage[];//used for creation
    status?: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface FilterCallsOptions {
    status?: CallStatus;
    calendar?: string;
    grant?: string;
    //populate?: boolean;
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




export const createEmptyCall = (call?: Partial<Call>): Call => ({
    title: "",
    status: CallStatus.planned,
    grant: call?.grant ?? '',
    description: ""
});