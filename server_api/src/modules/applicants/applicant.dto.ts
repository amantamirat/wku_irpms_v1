import { Accessibility, Gender } from "./applicant.enum";
import { IOwnership } from "./applicant.model";

export interface CreateApplicantDTO {
    workspace?: string;
    name: string;
    birthDate: Date;
    gender: Gender;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    roles?: string[];
    //ownerships?: IOwnership[];
    specializations?: string[];
    userId?: string;
}

export interface UpdateApplicantDTO {
    id: string;
    data: Partial<{
        workspace: string;
        name: string;
        birthDate: Date;
        gender: Gender;
        fin: string;
        orcid: string;
        accessibility: Accessibility[];
        specializations: string[];
        //ownerships: string[];
    }>;
    userId?: string;
}

//since it has the separete permission //create dto, repo and route
export interface UpdateRolesDTO {
    id: string;       // target user
    roles: string[];      // array of role IDs to assign
    applicantId?: string;    // actor, for auditing
}

export interface UpdateOwnershipsDTO {
    id: string;                     // target applicant
    ownerships: IOwnership[]; // full ownership definition
    applicantId: string;             // actor (auditing / permission)
}

export interface GetApplicantsDTO {
    workspace: string;
}


export interface ExistsApplicantDTO {
    workspace?: string;
    specialization?: string;
    role?:string;
}

