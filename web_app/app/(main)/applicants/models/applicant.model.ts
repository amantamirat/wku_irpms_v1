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
    workspace: string | Organization;
    name: string;
    birthDate: Date;
    gender: Gender;
    email?: string;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    roles?: Role[] | string[];
    ownerships?: Organization[] | string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GetApplicantsOptions {
    workspace?: string | Organization;
}

export const applicantUnits = [OrgnUnit.Department, OrgnUnit.External]

export const accessibilityOptions = Object.values(Accessibility).map(a => ({
    label: a,
    value: a
}));

export const genderOptions = Object.values(Gender).map(g => ({
    label: g,
    value: g
}));


export const validateApplicant = (applicant: Applicant): { valid: boolean; message?: string } => {

    if (!applicant.workspace) {
        return { valid: false, message: 'workspace is required.' };
    }

    if (!applicant.name) {
        return { valid: false, message: 'Name is required.' };
    }

    if (!applicant.birthDate || isNaN(new Date(applicant.birthDate).getTime())) {
        return { valid: false, message: 'Valid birth date is required.' };
    }

    if (!applicant.gender) {
        return { valid: false, message: 'Gender is required.' };
    }

    if (!applicant.email) {
        return { valid: false, message: 'Email is required.' };
    }

    if (applicant.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(applicant.email)) {
            return { valid: false, message: "Email is not valid." };
        }
    }
    if (applicant.fin) {
        const finRegex = /^\d{12}$/;
        if (!finRegex.test(applicant.fin)) {
            return { valid: false, message: "FIN must be a 12-digit number." };
        }
    }
    if (applicant.orcid) {
        const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
        if (!orcidRegex.test(applicant.orcid)) {
            return { valid: false, message: "ORCID must follow the format xxxx-xxxx-xxxx-xxxx." };
        }
    }
    return { valid: true };
};

export function sanitizeApplicant(applicant: Partial<Applicant>): Partial<Applicant> {
    return {
        ...applicant,
        workspace:
            typeof applicant.workspace === 'object' && applicant.workspace !== null
                ? (applicant.workspace as any)._id
                : applicant.workspace,
        roles: applicant.roles
            ?.map(role =>
                typeof role === 'object' && role !== null
                    ? (role as Role)._id
                    : role
            )
            .filter((id): id is string => typeof id === 'string'),

        ownerships: applicant.ownerships
            ?.map(org =>
                typeof org === 'object' && org !== null
                    ? (org as Organization)._id
                    : org
            )
            .filter((id): id is string => typeof id === 'string'),
    };
}

