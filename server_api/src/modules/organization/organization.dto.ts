// organization.dto.ts
import { AcademicLevel, Unit } from "../../common/constants/enums";
import { Classification, Ownership } from "./organization.enum";


export interface CreateOrganizationDTO {
    type: Unit;
    name: string;
    parent?: string;
    academicLevel?: AcademicLevel;
    classification?: Classification;
    ownership?: Ownership;
}


export interface UpdateOrganizationDTO {
    id: string;
    data: Partial<{
        name: string;
        parent: string;
        academicLevel: AcademicLevel;
        classification: Classification;
        ownership: Ownership;
    }>;
    userId: string;
}

export interface FilterOrganizationsDTO {
    type?: Unit;
    parent?: string;
    name?: string;
}

/*
export interface ExistsOrganizationDTO {
    parent?: string;
}
    */