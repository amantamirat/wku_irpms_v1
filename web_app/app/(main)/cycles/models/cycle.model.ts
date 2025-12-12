import { Calendar } from "../../calendars/models/calendar.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { Thematic } from "../../thematics/models/thematic.model";

// -----------------------------
// Enums
// -----------------------------
export enum CycleStatus {
  planned = "planned",
  active = "active",
  closed = "closed",
  archived = "archived"
}

export type CycleType = "Call" | "Program";
// -----------------------------
// Base Cycle Type
// -----------------------------
export type Cycle = {
  _id?: string;
  calendar: string | Calendar;
  grant: string | Grant;
  title: string;
  description?: string | null;
  theme?: string | Thematic;
  status: CycleStatus;
  type: CycleType;
  organization: string | Organization; // unified field
  createdAt?: Date;
  updatedAt?: Date;
};

// -----------------------------
// Validation
// -----------------------------
export const validateCycle = (cycle: Cycle): { valid: boolean; message?: string } => {
  if (!cycle.title || cycle.title.trim().length === 0) {
    return { valid: false, message: "Title is required." };
  }

  if (!cycle.calendar) {
    return { valid: false, message: "Calendar is required." };
  }

  if (!cycle.grant) {
    return { valid: false, message: "Grant is required." };
  }

  if (!cycle.status) {
    return { valid: false, message: "Status is required." };
  }

  if (!cycle.type) {
    return { valid: false, message: "Cycle type is required." };
  }

  if (!cycle.organization) {
    return { valid: false, message: "Organization (directorate or center) is required." };
  }

  return { valid: true };
};

// -----------------------------
// Sanitization (for API requests)
// -----------------------------
export const sanitizeCycle = (cycle: Partial<Cycle>): Partial<Cycle> => {
  return {
    ...cycle,
    calendar: typeof cycle.calendar === "object" ? (cycle.calendar as Calendar)._id : cycle.calendar,
    grant: typeof cycle.grant === "object" ? (cycle.grant as Grant)._id : cycle.grant,
    theme: typeof cycle.theme === "object" ? (cycle.theme as Thematic)._id : cycle.theme,
    organization:
      typeof cycle.organization === "object"
        ? (cycle.organization as Organization)._id
        : cycle.organization
  };
};
