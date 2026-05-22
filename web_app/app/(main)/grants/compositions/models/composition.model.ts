import { Gender, Accessibility } from "@/app/(main)/users/models/user.model";
import { AcademicLevel } from "@/app/(main)/organizations/models/organization.model";
import { Grant } from "../../models/grant.model";

export enum OperationMode {
  COUNT = "COUNT",
  RATIO = "RATIO" // Replaced PERCENTAGE to perfectly match your backend enum
}

export enum TargetScope {
  PI_ONLY = "PI_ONLY",
  CO_ONLY = "CO_ONLY",
  ALL_MEMBERS = "ALL_MEMBERS",
  TEAM_AGGREGATE = "TEAM_AGGREGATE"
}

export type Range = {
  min: number;
  max: number;
};

export type ProfileRule = {
  gender?: Gender;
  age?: Range;
  experienceYears?: Range;
  accessibility?: Accessibility[];
  academicLevels?: AcademicLevel[];
};

export type ProjectHistoryRule = {
  submission?: Range;
  rejection?: Range;
  completion?: Range;
};

export type Composition = {
  _id?: string;
  grant: string | Grant;
  description: string;
  targetScope: TargetScope;

  profileRule?: ProfileRule;
  projectHistoryRule?: ProjectHistoryRule;

  mode?: OperationMode;
  threshold?: Range;

  createdAt?: string | Date;
  updatedAt?: string | Date;
};

// --- Helper Validation Function for Ranges ---
const isValidRange = (range: Range | undefined, fieldName: string): { valid: boolean; message?: string } => {
  if (!range) return { valid: true };
  const { min, max } = range;

  if (min < 0 || max < 0) {
    return { valid: false, message: `${fieldName} values cannot be negative.` };
  }
  if (min > max) {
    return { valid: false, message: `Minimum ${fieldName.toLowerCase()} cannot be greater than maximum.` };
  }
  return { valid: true };
};

export const validateComposition = (
  composition: Composition
): { valid: boolean; message?: string } => {

  if (!composition.description || composition.description.trim().length === 0) {
    return { valid: false, message: "Description is required." };
  }

  if (!composition.grant) {
    return { valid: false, message: "Grant reference is required." };
  }

  if (!composition.targetScope) {
    return { valid: false, message: "Target scope is required." };
  }

  // 🔹 NEW: If target scope is TEAM_AGGREGATE, mode and threshold fields are explicitly required
  if (composition.targetScope === TargetScope.TEAM_AGGREGATE) {
    if (!composition.mode) {
      return { valid: false, message: "Evaluation Mode is required when Target Scope is set to Team Aggregate." };
    }
    if (!composition.threshold) {
      return { valid: false, message: "Threshold Range configuration is required for Team Aggregate rules." };
    }
  }

  // 🔹 Validate Threshold Range if Operation Mode is present
  if (composition.mode && composition.threshold) {
    const rangeCheck = isValidRange(composition.threshold, "Threshold");
    if (!rangeCheck.valid) return rangeCheck;
  }

  // 🔹 Validate Profile Rule Ranges
  if (composition.profileRule) {
    const ageCheck = isValidRange(composition.profileRule.age, "Age");
    if (!ageCheck.valid) return ageCheck;

    const expCheck = isValidRange(composition.profileRule.experienceYears, "Experience years");
    if (!expCheck.valid) return expCheck;
  }

  // 🔹 Validate Project History Rule Ranges
  if (composition.projectHistoryRule) {
    const subCheck = isValidRange(composition.projectHistoryRule.submission, "Submission history");
    if (!subCheck.valid) return subCheck;

    const rejCheck = isValidRange(composition.projectHistoryRule.rejection, "Rejection history");
    if (!rejCheck.valid) return rejCheck;

    const compCheck = isValidRange(composition.projectHistoryRule.completion, "Completion history");
    if (!compCheck.valid) return compCheck;
  }

  return { valid: true };
};

export function sanitizeComposition(
  composition: Partial<Composition>
): Partial<Composition> {
  return {
    ...composition,

    // 🔹 Map Grant object down to its string _id representation if populated
    grant:
      typeof composition.grant === "object" && composition.grant !== null
        ? (composition.grant as Grant)._id
        : composition.grant,
  };
}

export interface GetCompositionsOptions {
  grant?: Grant | string;
}