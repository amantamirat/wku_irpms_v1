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

export enum Classification {
    Regular = 'Regular',
    Evening = 'Evening',
    Weekend = 'Weekend'
}

export type Program= {
    _id?: string;
    department: string | Department;
    program_name: string;
    academic_level: AcademicLevel;
    classification: Classification;
};

export const validateProgram= (prog: Program): boolean => {
    if (!prog.department || prog.program_name.trim() === '') {
        return false;
    }
    return true;
};
