import { Organization, OrgnUnit } from "../../organizations/models/organization.model";


/*
// Used for also Category
export enum Scope {
    academic = 'Academic',
    supportive = 'Supportive',
    external = 'External',
}
*/

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export enum Accessibility {
    Visual = 'Visual',
    Hearing = 'Hearing',
    Mobility = 'Mobility',
    Speech = 'Speech',
    Cognitive = 'Cognitive'
    //Other = 'Other'
}

export type Applicant = {
    _id?: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    //scope: Scope;
    organization: string | Organization;
    email?: string;
    accessibility?: Accessibility[];
    user?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const applicantUnits = [OrgnUnit.Department, OrgnUnit.External, OrgnUnit.Supportive]


export const accessibilityOptions = Object.values(Accessibility).map(a => ({
    label: a,
    value: a
}));

export const genderOptions = Object.values(Gender).map(g => ({
    label: g,
    value: g
}));

/*
export const scopeOptions = Object.values(Scope).map(s => ({
    label: s,
    value: s
}));
*/


export const validateApplicant = (applicant: Applicant): { valid: boolean; message?: string } => {
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

    if (applicant.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(applicant.email)) {
            return { valid: false, message: "Email is not valid." };
        }
    }
    /*
    if (applicant.scope === Scope.academic && !applicant.organization) {
        return { valid: false, message: 'Department is required for academic category.' };
    }

    if (applicant.scope === Scope.supportive && !applicant.organization) {
        return { valid: false, message: 'Office is required for supportive category.' };
    }

    if (applicant.scope === Scope.external && !applicant.organization) {
        return { valid: false, message: 'External Organization is required for external category.' };
    }
*/
    return { valid: true };
};

/*

//convert the applicant scope to the approprate unit umbrella
export const scopeToOrganizationUnit: Record<Scope, OrganizationalUnit> = {
    [Scope.academic]: OrganizationalUnit.Department,
    [Scope.supportive]: OrganizationalUnit.Supportive,
    [Scope.external]: OrganizationalUnit.External,
};

*/

