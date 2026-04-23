import { Gender, Accessibility } from "@/app/(main)/users/models/user.model";
import { Position } from "@/app/(main)/users/positions/models/position.model";
import { PublicationType } from "@/app/(main)/users/publications/models/publication.model";
import { AcademicLevel } from "@/app/(main)/organizations/models/organization.model";
import { Specialization } from "@/app/(main)/specializations/models/specialization.model";
import { Grant } from "../../models/grant.model";

export enum OperationMode {
  COUNT = "COUNT",
  PERCENTAGE = "PERCENTAGE"
}


export type Range = {
  min: number;
  max: number;
};

export type Composition = {
  _id?: string;

  grant?: string | Grant;

  title?: string;

  gender?: Gender;

  age?: Range;
  experienceYears?: Range;

  accessibility?: Accessibility[];

  maxSubmission?: number;
  minCompletion?: number;

  academicLevels?: AcademicLevel[];

  specializations?: string[] | Specialization[];

  positions?: string[] | Position[];

  publicationTypes?: PublicationType[];

  programTypes?: AcademicLevel[];

  isPI?: boolean;

  opMode?: OperationMode;
  minCount: number;

  createdAt?: Date;
  updatedAt?: Date;
};



export const validateComposition = (
  composition: Composition
): { valid: boolean; message?: string } => {

  if (!composition.title || composition.title.trim().length === 0) {
    return { valid: false, message: "Title is required." };
  }

  if (!composition.grant) {
    return { valid: false, message: "Grant is required." };
  }

  if (!composition.minCount || composition.minCount < 1) {
    return { valid: false, message: "Minimum count must be at least 1." };
  }

  // 🔹 Validate age range
  if (composition.age) {
    const { min, max } = composition.age;

    if (min < 0 || max < 0) {
      return { valid: false, message: "Age cannot be negative." };
    }

    if (min > max) {
      return { valid: false, message: "Minimum age cannot be greater than maximum age." };
    }
  }

  // 🔹 Validate experience range
  if (composition.experienceYears) {
    const { min, max } = composition.experienceYears;

    if (min < 0 || max < 0) {
      return { valid: false, message: "Experience years cannot be negative." };
    }

    if (min > max) {
      return { valid: false, message: "Minimum experience cannot be greater than maximum experience." };
    }
  }

  return { valid: true };
};


export function sanitizeComposition(
  composition: Partial<Composition>
): Partial<Composition> {
  return {
    ...composition,

    // 🔹 Grant (object → _id)
    grant:
      typeof composition.grant === "object" && composition.grant !== null
        ? (composition.grant as Grant)._id
        : composition.grant,

    // 🔹 Specializations (array of objects → array of _id)
    specializations: composition.specializations?.map((item) =>
      typeof item === "object" && item !== null
        ? (item as Specialization)._id!
        : item
    ),

    // 🔹 Positions (array of objects → array of _id)
    positions: composition.positions?.map((item) =>
      typeof item === "object" && item !== null
        ? (item as Position)._id!
        : item
    ),
  };
}


export interface GetCompositionsOptions {
  grant?: Grant | string;
}


