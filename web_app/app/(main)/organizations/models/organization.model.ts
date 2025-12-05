// Enum for Organization Types
export enum OrgnUnit {
    College = 'College',
    Department = 'Department',
    Program = 'Program',
    Directorate = 'Directorate',
    Center = 'Center',
    //Supportive = 'Supportive',
    //Sector = 'Sector',
    External = 'External',
    //Specialization = 'Specialization'
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
    name: string;
    type: OrgnUnit;
    academic_level?: AcademicLevel;
    classification?: Classification;
    ownership?: Ownership;
    address?: Address;
    parent?: string | Organization;
    createdAt?: string;
    updatedAt?: string;
};

export const getChildType = (current: OrgnUnit): OrgnUnit | undefined => {
    switch (current) {
        case OrgnUnit.College:
            return OrgnUnit.Department;
        case OrgnUnit.Department:
            return OrgnUnit.Program;
        case OrgnUnit.Directorate:
            return OrgnUnit.Center;
        //case OrgnUnit.Sector:
        //    return OrgnUnit.External;
        default:
            return undefined; // No children
    }
};

export const getParentType = (current: OrgnUnit): OrgnUnit | undefined => {
    switch (current) {
        case OrgnUnit.Department:
            return OrgnUnit.College;
        case OrgnUnit.Program:
            return OrgnUnit.Department;
        case OrgnUnit.Center:
            return OrgnUnit.Directorate;
        // case OrgnUnit.External:
        //     return OrgnUnit.Sector;
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
        case OrgnUnit.Program:
            if (!organization.academic_level) {
                return { valid: false, message: 'Academic level is required for Program.' };
            }
            if (!organization.classification) {
                return { valid: false, message: 'Classification is required for Program.' };
            }
            break;

        /*
    case OrgnUnit.Specialization:
        if (!organization.academic_level) {
            return { valid: false, message: 'Academic level is required for Specialization.' };
        }
        break;
*/
        case OrgnUnit.External:
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


export function sanitizeOrganization(organization: Partial<Organization>): Partial<Organization> {
    return {
        ...organization,
        parent:
            typeof organization.parent === 'object' && organization.parent !== null
                ? (organization.parent as Organization)._id
                : organization.parent,
    };
}



