// Enum for Organization Types
export enum OrgnUnit {
    college = 'college',
    department = 'department',
    program = 'program',
    directorate = 'directorate',
    center = 'center',
    external = 'external'
}

// Enum for Academic Levels
export enum AcademicLevel {
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

// Enum for Classification
export enum Classification {
    Regular = 'Regular',
    Weekend = 'Weekend',
    Evening = 'Evening',
}

// Enum for Ownership
export enum Ownership {
    Internal = 'Internal',
    Private = 'Private',
    Public = 'Public',
    NGO = 'NGO',
}



// Address Type
export type Address = {
    region?: string;
    zone?: string;
    woreda?: string;
    city?: string;
    kebele?: string;
};

export type Organization = {
    _id?: string;
    type: OrgnUnit;
    name?: string;
    academicLevel?: AcademicLevel;
    classification?: Classification;
    ownership?: Ownership;
    address?: Address;
    parent?: string | Organization;
    createdAt?: string;
    updatedAt?: string;
};

export interface GetOrganizationsOptions {
    type: OrgnUnit;
    parent?: Organization;
}


export const getChildType = (current: OrgnUnit): OrgnUnit | undefined => {
    switch (current) {
        case OrgnUnit.college:
            return OrgnUnit.department;
        case OrgnUnit.department:
            return OrgnUnit.program;
        case OrgnUnit.directorate:
            return OrgnUnit.center;
        default:
            return undefined; // No children
    }
};

export const getParentType = (current: OrgnUnit): OrgnUnit | undefined => {
    switch (current) {
        case OrgnUnit.department:
            return OrgnUnit.college;
        case OrgnUnit.program:
            return OrgnUnit.department;
        case OrgnUnit.center:
            return OrgnUnit.directorate;
        default:
            return undefined; // Root-level types have no parent
    }
};

export const validateOrganization = (
    organization: Organization
): { valid: boolean; message?: string } => {

    if (!organization.name || organization.name.trim() === '') {
        return { valid: false, message: 'Name is required.' };
    }

    if (!organization.type) {
        return { valid: false, message: 'Type is required.' };
    }

    switch (organization.type) {
        case OrgnUnit.program:
            if (!organization.academicLevel) {
                return { valid: false, message: 'Academic level is required for Program.' };
            }
            if (!organization.classification) {
                return { valid: false, message: 'Classification is required for Program.' };
            }
            break;

        case OrgnUnit.external:
            if (!organization.ownership) {
                return { valid: false, message: 'Ownership is required for External.' };
            }
            break;
    }
    const parent = getParentType(organization.type);
    if (parent && !organization.parent) {
        return { valid: false, message: `${organization.type} requires  ${parent} as parent organization.` };
    }
    return { valid: true };
};


export function sanitize(organization: Partial<Organization>): Partial<Organization> {
    return {
        ...organization,
        parent:
            typeof organization.parent === 'object' && organization.parent !== null
                ? (organization.parent as Organization)._id
                : organization.parent,
    };
}

export const createEmptyOrganization = (org: Organization): Organization => ({
    type: org.type,
    name: "",
});



