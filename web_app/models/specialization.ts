import { AcademicLevel } from "./program";

export type Specialization = {
    _id?: string;
    specialization_name: string;
    academic_level: AcademicLevel;
};

export const validateSpecialization = (spec: Specialization): boolean => {
    if (spec.specialization_name.trim() === '') {
        return false;
    }
    return true;
};
