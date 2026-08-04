import { Accessibility, Gender } from "../../users/user.model";
import { AcademicLevel } from "../../../common/constants/enums";
import { IRangeDTO } from "../composition.dto";




/**
 * Create Eligibility Profile
 */
export interface CreateProfileDTO {

    name: string;

    description: string;


    gender?: Gender;


    age?: IRangeDTO;


    experienceYears?: IRangeDTO;


    accessibility?: Accessibility[];


    academicLevels?: AcademicLevel[];


    userId?: string;
}



/**
 * Update Eligibility Profile
 */
export interface UpdateProfileDTO {

    id: string;


    data: Partial<CreateProfileDTO>;


    userId?: string;
}



/**
 * Get Profiles Query
 */
export interface GetProfileDTO {

    populate?: boolean;

}