import { Accessibility, Gender } from "../../applicants/applicant.enum";
import { AcademicLevel } from "../../../common/constants/enums";
import { PublicationType } from "../../applicants/publications/publication.model";

// Sub-DTO for ranges
export interface RangeDTO {
    min: number;
    max: number;
}

// DTO for creating a new Composition
export interface CreateCompositionDTO {
    grant: string; // grant ObjectId as string
    title: string;

    gender?: Gender;

    age?: RangeDTO;                 // min/max age
    experienceYears?: RangeDTO;     // min/max experience

    accessibility?: Accessibility[];

    maxSubmission?: number;
    minCompletion?: number;

    academicLevels?: AcademicLevel[];
    specializations?: string[];

    positions?: string[];

    publicationTypes?: PublicationType[];

    programTypes?: AcademicLevel[];

    isPI?: boolean;

    minCount: number;
}

// DTO for updating an existing Composition
export interface UpdateCompositionDTO {
    id: string; // composition id to update
    data: Partial<{
        title: string;
        gender?: Gender;

        age?: RangeDTO;
        experienceYears?: RangeDTO;

        accessibility?: Accessibility[];

        maxSubmission?: number;
        minCompletion?: number;

        academicLevels?: AcademicLevel[];
        specializations?: string[];

        positions?: string[];

        publicationTypes?: PublicationType[];

        programTypes?: AcademicLevel[];

        //isPI?: boolean;

        minCount?: number;
    }>;
    userId: string; // who is performing the update
}

export interface GetCompositionDTO {
    grant?: string;
    populate?: boolean;
}

export interface ExistsCompositionDTO {
    grant?: string;
}