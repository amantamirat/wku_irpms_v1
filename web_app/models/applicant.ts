import { Department } from "./department";
import { Institute } from "./institute";
import { Category, Position } from "./position";
import { Rank } from "./rank";

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export type Applicant = {
    _id?: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    department?: string | Department;
    position?: string | Position;
    rank?: string | Rank;
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




    const positionObj = typeof applicant.position === 'string' ? null : applicant.position;

    if (positionObj && positionObj.category === Category.academic && !applicant.department) {
        return {
            valid: false,
            message: 'Department is required for academic positions.',
        };
    }


    return { valid: true };
};