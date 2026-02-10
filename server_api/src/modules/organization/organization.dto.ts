// organization.dto.ts
import { AcademicLevel } from "../../common/constants/enums";
import { Classification, Ownership } from "./organization.enum";
import { Unit } from "./organization.type";

export interface CreateOrganizationDTO {
    type: Unit;
    name: string;
    // optional depending on organization type
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

export interface GetOrganizationsDTO {
    type: Unit;
    parent?: string;
}


export interface ExistsOrganizationDTO {
    parent?: string;
}