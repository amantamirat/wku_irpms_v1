import { Category, Organization } from "./organization";

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export enum Accessibility {
    Visual = 'Visual',
    Hearing = 'Hearing',
    Mobility = 'Mobility',
    Speech = 'Speech',
    Cognitive = 'Cognitive',
    Other = 'Other'
}

export type Applicant = {
    _id?: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    scope: Category;
    organization: string | Organization;
    accessibility? : Accessibility[];
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

    if (applicant.scope === Category.academic && !applicant.organization) {
        return { valid: false, message: 'Department is required for academic category.' };
    }

    if (applicant.scope === Category.supportive && !applicant.organization) {
        return { valid: false, message: 'Office is required for supportive category.' };
    }

    if (applicant.scope === Category.external && !applicant.organization) {
        return { valid: false, message: 'External Organization is required for external category.' };
    }
        
    return { valid: true };
};