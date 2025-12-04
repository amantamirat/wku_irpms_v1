// organization.dto.ts
import { AcademicLevel, Classification, Ownership, Unit } from "./organization.enum";

/**
 * Base DTO fields shared by all organizations
 */
interface BaseOrganizationDTO {
    type: Unit;
    name: string;
}

/**
 * Optional parent for sub-organizations
 */
interface WithParentDTO {
    parent: string;
}

/**
 * Create DTO for each discriminator type
 */

export interface CreateCollegeDTO extends BaseOrganizationDTO {
    type: Unit.College;
}

export interface CreateDirectorateDTO extends BaseOrganizationDTO {
    type: Unit.Directorate;
}

export interface CreateSectorDTO extends BaseOrganizationDTO {
    type: Unit.Sector;
}

export interface CreateSpecializationDTO extends BaseOrganizationDTO {
    type: Unit.Specialization;
    academic_level: AcademicLevel;
}

export interface CreateDepartmentDTO extends BaseOrganizationDTO, WithParentDTO {
    type: Unit.Department;
}

export interface CreateCenterDTO extends BaseOrganizationDTO, WithParentDTO {
    type: Unit.Center;
}

export interface CreateProgramDTO extends BaseOrganizationDTO, WithParentDTO {
    type: Unit.Program;
    academic_level: AcademicLevel;
    classification: Classification;
}

export interface CreateExternalDTO extends BaseOrganizationDTO, WithParentDTO {
    type: Unit.External;
    ownership: Ownership;
}

/**
 * Union of all DTOs
 */
export type CreateOrganizationDTO =
    | CreateCollegeDTO
    | CreateDirectorateDTO
    | CreateSectorDTO
    | CreateSpecializationDTO
    | CreateDepartmentDTO
    | CreateCenterDTO
    | CreateProgramDTO
    | CreateExternalDTO;


export interface UpdateOrganizationDTO {
    id: string;
    data: Partial<{
        name: string;
        parentId: string;
        academic_level: AcademicLevel;
        classification: Classification;
        ownership: Ownership;
    }>;
    userId: string;
}

export interface GetOrganizationsDTO {
    type?: Unit;
    parent?: string;
}
