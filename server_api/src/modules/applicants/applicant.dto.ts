import { Accessibility, Gender } from "./applicant.enum";

export interface CreateApplicantDTO {
    workspace: string;
    firstName: string;
    lastName: string;
    birthDate: Date;
    gender: Gender;
    email: string;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    userId?: string;
}

export interface UpdateApplicantDTO {
    id: string;
    data: Partial<{
        workspace: string;
        firstName: string;
        lastName: string;
        birthDate: Date;
        gender: Gender;
        email: string;
        fin: string;
        orcid: string;
        accessibility: Accessibility[];
        roles: string[];
        ownerships: string[];
    }>;
    userId?: string;
}


export interface GetApplicantsDTO {
    workspace?: string;
}

export interface FindApplicantDTO {
    id: string;
    email: string;
}

