// Enum for Organization Types
export enum OrganizationalUnit {
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
    academic = 'academic',
    supportive = 'supportive',
    external = 'external',
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
    type: OrganizationalUnit;
    academic_level?: AcademicLevel;
    classification?: Classification;
    ownership?: Ownership;
    address?: Address;
    category?: Category;
    parent?: string | Organization;
    createdAt?: string; // ISO string date
    updatedAt?: string;
};

export const getChildType = (current: OrganizationalUnit): OrganizationalUnit | null => {
    switch (current) {
        case OrganizationalUnit.College:
            return OrganizationalUnit.Department;
        case OrganizationalUnit.Department:
            return OrganizationalUnit.Program;
        case OrganizationalUnit.Directorate:
            return OrganizationalUnit.Center;
        case OrganizationalUnit.Sector:
            return OrganizationalUnit.External;
        case OrganizationalUnit.Position:
            return OrganizationalUnit.Rank;
        default:
            return null; // No children
    }
};

export const getParentType = (current: OrganizationalUnit): OrganizationalUnit | null => {
    switch (current) {
        case OrganizationalUnit.Department:
            return OrganizationalUnit.College;
        case OrganizationalUnit.Program:
            return OrganizationalUnit.Department;
        case OrganizationalUnit.Center:
            return OrganizationalUnit.Directorate;
        case OrganizationalUnit.External:
            return OrganizationalUnit.Sector;
        case OrganizationalUnit.Rank:
            return OrganizationalUnit.Position;
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
        case OrganizationalUnit.Program:
            if (!organization.academic_level) {
                return { valid: false, message: 'Academic level is required for Program.' };
            }
            if (!organization.classification) {
                return { valid: false, message: 'Classification is required for Program.' };
            }
            break;

        case OrganizationalUnit.Specialization:
            if (!organization.academic_level) {
                return { valid: false, message: 'Academic level is required for Specialization.' };
            }
            break;

        case OrganizationalUnit.External:
            if (!organization.ownership) {
                return { valid: false, message: 'Ownership is required for External.' };
            }
            break;

        case OrganizationalUnit.Position:
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



