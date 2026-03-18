import { Calendar } from "../../calendars/models/calendar.model";
import { Grant } from "../../grants/models/grant.model";

// -----------------------------
// Enums
// -----------------------------
export enum CallStatus {
  planned = "planned",
  active = "active",
  closed = "closed"
}

export type Call = {
  _id?: string;
  calendar: string | Calendar;
  //directorate: string | Organization;
  grant: string | Grant;
  title: string;
  description?: string | null;
  //thematic?: string | Thematic;
  status: CallStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface GetCallsOptions {
  calendar?: string | Calendar;
  //directorate?: string | Organization;
  grant?: string | Grant;
  status?: CallStatus;
  populate?: boolean;
}

// -----------------------------
// Validation
// -----------------------------
export const validateCall = (call: Call): { valid: boolean; message?: string } => {
  if (!call.title || call.title.trim().length === 0) {
    return { valid: false, message: "Title is required." };
  }

  if (!call.calendar) {
    return { valid: false, message: "Calendar is required." };
  }

  if (!call.grant) {
    return { valid: false, message: "Grant is required." };
  }

  if (!call.status) {
    return { valid: false, message: "Status is required." };
  }

  /*
  if (!call.directorate) {
    return { valid: false, message: "Directorate is required." };
  }
  */

  return { valid: true };
};

// -----------------------------
// Sanitization (for API requests)
// -----------------------------
export const sanitizeCall = (call: Partial<Call>): Partial<Call> => {
  return {
    ...call,
    calendar: typeof call.calendar === "object" ? (call.calendar as Calendar)._id : call.calendar,
    grant: typeof call.grant === "object" ? (call.grant as Grant)._id : call.grant,
    /*
      thematic: typeof call.thematic === "object" ? (call.thematic as Thematic)._id : call.thematic,
      directorate:
        typeof call.directorate === "object"
          ? (call.directorate as Organization)._id
          : call.directorate*/
  };
};


export const createEmptyCall = (): Call => ({
    title: "",
    status: CallStatus.planned,
    calendar: '',
    grant: '',
    description: ""
});
