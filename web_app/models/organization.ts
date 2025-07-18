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
    MA = 'MA',
    MSc = 'MSc',
    PhD = 'PhD',
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
