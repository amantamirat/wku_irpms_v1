import { Department } from "./department";

export enum AcademicLevel {
    Certificate = 'Certificate',
    Diploma = 'Diploma',
    BA = 'BA',
    BSc = 'BSc',
    BT = 'BT',
    MA = 'MA',
    MSc = 'MSc',
    MPhil = 'MPhil',
    MT = 'MT',
    PhD = 'PhD',
    PostDoc = 'PostDoc'
}

export type Specialization = {
    _id?: string;
    department: string | Department;
    specialization_name: string;
    academic_level: AcademicLevel;
};

export const validateSpecialization = (spec: Specialization): boolean => {
    if (!spec.department || spec.specialization_name.trim() === '') {
        return false;
    }
    return true;
};
