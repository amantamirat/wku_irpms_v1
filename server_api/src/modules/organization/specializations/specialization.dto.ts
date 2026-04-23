import { AcademicLevel } from "../../../common/constants/enums";


export interface CreateSpecializationDTO {
    name: string;
    academicLevel: AcademicLevel;
}

export interface UpdateSpecializationDTO {
    id: string;
    data: Partial<{
        name: string;
        academicLevel: AcademicLevel;
    }>;
}

export interface GetSpecializationsOptions {
    academicLevel?: AcademicLevel;
}