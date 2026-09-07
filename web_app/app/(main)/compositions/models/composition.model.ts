import { IRange, isValidRange } from "@/types/range";
import { HistoryRule } from "./history.model";
import { EligibilityProfile } from "./profile.model";
import { MemberRequirement } from "./requirement.model";


export type Composition = {
  _id?: string;
  name: string;
  description?: string;
  leadProfileRule?: string | EligibilityProfile;
  leadHistoryRule?: string | HistoryRule;
  memberRequirements: string[] | MemberRequirement[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

// --- Helper Validation Function for Ranges ---
export const validateRange = (
  range: IRange | undefined,
  fieldName: string
): { valid: boolean; message?: string } => {
  if (!range) return { valid: true };

  if (!isValidRange(range)) {
    if (range.min < 0 || range.max < 0) {
      return {
        valid: false,
        message: `${fieldName} values cannot be negative.`,
      };
    }
    if (range.min > range.max) {
      return {
        valid: false,
        message: `Minimum ${fieldName.toLowerCase()} cannot be greater than maximum.`,
      };
    }
    return {
      valid: false,
      message: `${fieldName} contains invalid range values.`,
    };
  }

  return { valid: true };
};

// ---------- Validation ----------

export const validateComposition = (
  composition: Composition
): { valid: boolean; message?: string } => {
  if (!composition.name || composition.name.trim().length === 0) {
    return {
      valid: false,
      message: "Name is required.",
    };
  }

  return {
    valid: true,
  };
};

