import { Accessibility, Gender } from "../../users/user.model";
import { AcademicLevel } from "../../../common/constants/enums";
import { IRange } from "../../../common/types/range";

/**
 * Create Eligibility Profile
 */
export interface CreateProfileDTO {
    name: string;
    description: string;
    gender?: Gender;
    age?: IRange;
    experienceYears?: IRange;
    accessibility?: Accessibility[];
    academicLevels?: AcademicLevel[];
    //userId?: string;
}



/**
 * Update Eligibility Profile
 */
export interface UpdateProfileDTO {
    id: string;
    data: Partial<CreateProfileDTO>;
    //userId?: string;
}