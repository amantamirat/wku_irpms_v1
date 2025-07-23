// Enum for Organization Types
export enum OrganizationType {
    College = 'College',
    Department = 'Department',
    Program = 'Program',
    Directorate = 'Directorate',
    Center = 'Center',
    Supportive = 'Supportive',
    Sector = 'Sector',
    External = 'External',
    Specialization = 'Specialization',
    Position = 'Position',
    Rank = 'Rank',
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
    Private = 'Private',
    Public = 'Public',
    NGO = 'NGO',
}

// Enum for Category
export enum Category {
    Academic = 'academic',
    Supportive = 'supportive',
    External = 'external',
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
    type: OrganizationType;
    academic_level?: AcademicLevel;
    classification?: Classification;
    ownership?: Ownership;
    address?: Address;
    category?: Category;
    parent?: string | Organization;
    createdAt?: string; // ISO string date
    updatedAt?: string;
};

export const getChildType = (current: OrganizationType): OrganizationType | null => {
    switch (current) {
        case OrganizationType.College:
            return OrganizationType.Department;
        case OrganizationType.Department:
            return OrganizationType.Program;
        case OrganizationType.Directorate:
            return OrganizationType.Center;
        case OrganizationType.Sector:
            return OrganizationType.External;
        case OrganizationType.Position:
            return OrganizationType.Rank;
        default:
            return null; // No children
    }
};

export const getParentType = (current: OrganizationType): OrganizationType | null => {
    switch (current) {
        case OrganizationType.Department:
            return OrganizationType.College;
        case OrganizationType.Program:
            return OrganizationType.Department;
        case OrganizationType.Center:
            return OrganizationType.Directorate;
        case OrganizationType.External:
            return OrganizationType.Sector;
        case OrganizationType.Rank:
            return OrganizationType.Position;
        default:
            return null; // Root-level types have no parent
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
        case OrganizationType.Program:
            if (!organization.academic_level) {
                return { valid: false, message: 'Academic level is required for Program.' };
            }
            if (!organization.classification) {
                return { valid: false, message: 'Classification is required for Program.' };
            }
            break;

        case OrganizationType.Specialization:
            if (!organization.academic_level) {
                return { valid: false, message: 'Academic level is required for Specialization.' };
            }
            break;

        case OrganizationType.External:
            if (!organization.ownership) {
                return { valid: false, message: 'Ownership is required for External.' };
            }
            break;

        case OrganizationType.Position:
            if (!organization.category) {
                return { valid: false, message: 'Category is required for Position.' };
            }
            break;
    }
    const parent = getParentType(organization.type);
    if (parent && !organization.parent) {
        return { valid: false, message: `${organization.type} requires  ${parent} as parent organization.` };
    }
    return { valid: true };
};



