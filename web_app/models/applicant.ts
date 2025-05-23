import { Department } from "./department";
import { Organization } from "./organization";
import { Category } from "./position";
import { Rank } from "./rank";

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export enum Scope {
    academic = 'academic',
    supportive = 'supportive',
    external = 'external',
}


export type Applicant = {
    _id?: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    scope: Scope;
    department?: string | Department;
    createdAt?: Date;
    updatedAt?: Date;
}


export const validateApplicant = (
    applicant: Applicant
): { valid: boolean; message?: string } => {

    if (!applicant.first_name) {
        return { valid: false, message: 'First name is required.' };
    }

    if (!applicant.last_name) {
        return { valid: false, message: 'Last name is required.' };
    }

    if (!applicant.birth_date || isNaN(new Date(applicant.birth_date).getTime())) {
        return { valid: false, message: 'Valid birth date is required.' };
    }

    if (!applicant.gender) {
        return { valid: false, message: 'Gender is required.' };
    }

    if (applicant.scope === Scope.academic && !applicant.department) {
        return { valid: false, message: 'Department is required for academic category.' };
    }
        
    return { valid: true };
};