import { Accessibility, Gender } from "./user.model";


export interface CreateUserDTO {
    workspace?: string;
    name: string;
    birthDate?: Date;
    gender?: Gender;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    specializations?: string[];
}


export interface UpdateUserDTO {
    id: string;

    data: Partial<{
        workspace: string | null;
        name: string;
        birthDate: Date;
        gender: Gender;
        fin: string;
        orcid: string;
        accessibility: Accessibility[];
        specializations: string[];
    }>;
}


export interface UpdateRolesDTO {
    id: string;
    roles: string[];
}

export interface ScopeDataDTO {
    scope: string[] | "*" | null;
}


export interface FilterUsersDTO {
    ids?: string[];
    workspace?: string;
    name?: string;
    specialization?: string;
    role?: string;
}