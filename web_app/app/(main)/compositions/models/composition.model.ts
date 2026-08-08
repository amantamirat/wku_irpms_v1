import { HistoryRule } from "./history.model";
import { EligibilityProfile } from "./profile.model";
import { MemberRequirement } from "./requirement.model";

export type IRange = {
  min: number;
  max: number;
};

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
export const isValidRange = (
  range: IRange | undefined,
  fieldName: string
): { valid: boolean; message?: string } => {
  if (!range) return { valid: true };

  const { min, max } = range;

  if (min < 0 || max < 0) {
    return {
      valid: false,
      message: `${fieldName} values cannot be negative.`,
    };
  }

  if (min > max) {
    return {
      valid: false,
      message: `Minimum ${fieldName.toLowerCase()} cannot be greater than maximum.`,
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


  /*
  if (!composition.memberRequirements ||
    composition.memberRequirements.length === 0) {

    return {
      valid: false,
      message: "At least one member requirement is required.",
    };
  }
    */


  return {
    valid: true,
  };
};


// ---------- Sanitizer ----------
export function sanitizeComposition(
  composition: Partial<Composition>
): Partial<Composition> {

  return {
    ...composition,

    leadProfileRule:
      typeof composition.leadProfileRule === "object" &&
        composition.leadProfileRule !== null
        ? composition.leadProfileRule._id
        : composition.leadProfileRule,


    leadHistoryRule:
      typeof composition.leadHistoryRule === "object" &&
        composition.leadHistoryRule !== null
        ? composition.leadHistoryRule._id
        : composition.leadHistoryRule,


    memberRequirements:
      composition.memberRequirements
        ?.map((item) =>
          typeof item === "object" && item !== null
            ? item._id
            : item
        )
        .filter((id): id is string => !!id),
  };
}