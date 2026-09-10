import { Gender, Accessibility } from "@/app/(main)/users/models/user.model";
import { AcademicLevel } from "@/app/(main)/organizations/models/organization.model";
import { IRange, isValidRange } from "@/types/range";


export type EligibilityProfile = {
    _id?: string;
    name: string;
    description?: string;
    gender?: Gender;
    age?: IRange;
    experienceYears?: IRange;
    accessibility?: Accessibility[];
    academicLevels?: AcademicLevel[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

export const validateEligibilityProfile = (
  profile: EligibilityProfile
): { valid: boolean; message?: string } => {
  if (!profile.name || profile.name.trim().length === 0) {
    return {
      valid: false,
      message: "Name is required.",
    };
  }

  if (profile.age && !isValidRange(profile.age)) {
    return {
      valid: false,
      message: "Age range is invalid. Ensure values are non-negative and Min is less than or equal to Max.",
    };
  }

  if (profile.experienceYears && !isValidRange(profile.experienceYears)) {
    return {
      valid: false,
      message: "Experience years range is invalid. Ensure values are non-negative and Min is less than or equal to Max.",
    };
  }

  return {
    valid: true,
  };
};
