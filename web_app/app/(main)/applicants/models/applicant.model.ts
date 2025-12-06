import { Organization, OrgnUnit } from "../../organizations/models/organization.model";
import { Role } from "../../roles/models/role.model";


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
    organization: string | Organization;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    //scope: Scope;
    email?: string;
    user?: string;
    accessibility?: Accessibility[];
    roles?: Role[] | string[];
    organizations?: Organization[] | string[];
    createdAt?: Date;
    updatedAt?: Date;
}


export const applicantUnits = [OrgnUnit.Department, OrgnUnit.External //, OrgnUnit.Supportive
]


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

    return { valid: true };
};

export function sanitizeApplicant(applicant: Partial<Applicant>): Partial<Applicant> {
    return {
        ...applicant,
        organization:
            typeof applicant.organization === 'object' && applicant.organization !== null
                ? (applicant.organization as any)._id
                : applicant.organization,
        roles: applicant.roles
            ?.map(role =>
                typeof role === 'object' && role !== null
                    ? (role as Role)._id
                    : role
            )
            .filter((id): id is string => typeof id === 'string'),

        organizations: applicant.organizations
            ?.map(org =>
                typeof org === 'object' && org !== null
                    ? (org as Organization)._id
                    : org
            )
            .filter((id): id is string => typeof id === 'string'),
    };
}

