import { Department } from "./department";
import { Institute } from "./institute";
import { Rank } from "./rank";

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export type Applicant = {
    _id?: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    rank: string | Rank;
    department?: string | Department;
    hire_date?: Date;
    institute?: string | Institute;
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

    if (!applicant.rank) {
        return { valid: false, message: 'Rank is required.' };
    }

    return { valid: true };
};