import { Accessibility, Gender } from "./user.model";
import { IOwnership } from "./user.model";

export interface CreateUserDTO {
    workspace?: string;
    name: string;
    birthDate: Date;
    gender: Gender;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    roles?: string[];
    ownerships?: IOwnership[];
    specializations?: string[];
    userId?: string;
}

export interface UpdateUserDTO {
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

export interface GetUsersDTO {
    workspace: string;
    populate?: boolean;
}

export interface ExistsUserDTO {
    workspace?: string;
    specialization?: string;
    role?: string;
}

