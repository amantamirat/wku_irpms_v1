import { Accessibility, Gender } from "./applicant.enum";

export interface CreateApplicantDTO {
    organization: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
}

export interface UpdateApplicantDTO {
    id: string;
    data: Partial<{
        organization: string;
        first_name: string;
        last_name: string;
        birth_date: Date;
        gender: Gender;
        fin: string;
        orcid: string;
        accessibility: Accessibility[];
    }>;
    userId?: string;
}

export interface UpdateRolesDTO {
    id: string;
    data: Partial<{
        roles: string[];
        organizations: string[];
    }>;
    userId?: string;
}

export interface GetApplicantsDTO {
    organization?: string;
}

