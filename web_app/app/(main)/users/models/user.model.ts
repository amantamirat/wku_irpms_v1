import { Organization, OrgnUnit } from "../../organizations/models/organization.model";
import { Role } from "../../roles/models/role.model";
import { Specialization } from "../../specializations/models/specialization.model";

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

export type IOwnership = {
    unitType: OrgnUnit;
    scope: any[] | '*';
};

export type User = {
    _id?: string;
    workspace?: string | Organization;
    name: string;
    birthDate?: Date;
    gender?: Gender;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    specializations?: Specialization[] | string[];
    roles?: string[] | Role[];
    ownerships?: IOwnership[];
    createdAt?: Date;
    updatedAt?: Date;
    //populate?: boolean;
}

export interface FilterUsersOptions {
    workspace?: string | Organization;
}

export const userUnits = [OrgnUnit.department, OrgnUnit.external]

export const accessibilityOptions = Object.values(Accessibility).map(a => ({
    label: a,
    value: a
}));

export const genderOptions = Object.values(Gender).map(g => ({
    label: g,
    value: g
}));


export const validateUser = (user: User): { valid: boolean; message?: string } => {

    if (!user.workspace) {
        return { valid: false, message: 'workspace is required.' };
    }

    if (!user.name) {
        return { valid: false, message: 'Name is required.' };
    }

    if (!user.birthDate || isNaN(new Date(user.birthDate).getTime())) {
        return { valid: false, message: 'Valid birth date is required.' };
    }

    if (!user.gender) {
        return { valid: false, message: 'Gender is required.' };
    }

    if (user.fin) {
        const finRegex = /^\d{12}$/;
        if (!finRegex.test(user.fin)) {
            return { valid: false, message: "FIN must be a 12-digit number." };
        }
    }
    if (user.orcid) {
        const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/;
        if (!orcidRegex.test(user.orcid)) {
            return { valid: false, message: "ORCID must follow the format xxxx-xxxx-xxxx-xxxx." };
        }
    }
    return { valid: true };
};




export const createEmptyUser = (): User => ({
    name: "",
    birthDate: new Date(),
    gender: Gender.Male
})

