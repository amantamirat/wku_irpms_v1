import { Gender, Accessibility } from "@/app/(main)/users/models/user.model";
import { AcademicLevel } from "@/app/(main)/organizations/models/organization.model";
import { isValidRange, IRange } from "./composition.model";

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
    if (profile.age) {
        const ageCheck = isValidRange(profile.age, "Age");
        if (!ageCheck.valid) return ageCheck;
    }
    if (profile.experienceYears) {
        const experienceCheck = isValidRange(
            profile.experienceYears,
            "Experience years"
        );

        if (!experienceCheck.valid) return experienceCheck;
    }
    return {
        valid: true,
    };
};


// ---------- Sanitizer ----------

export function sanitizeEligibilityProfile(
    profile: Partial<EligibilityProfile>
): Partial<EligibilityProfile> {
    return {
        ...profile,
    };
}