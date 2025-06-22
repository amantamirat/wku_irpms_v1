import mongoose, { Schema, Document, Types } from 'mongoose';

// Enum for Organization Types
export enum OrganizationType {
    College = 'College',
    Department = 'Department',
    Program = 'Program',
    Directorate = 'Directorate',
    Center = 'Center',
    Supportive = 'Supportive',
    Sector = 'Sector',
    External = 'Organization (External)',
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

// Enum for Position Category
export enum Category {
    Academic = 'academic',
    Supportive = 'supportive',
    External = 'external',
}

// Permission interface (assumes you have a Permission model or sub-schema)
interface Permission {
    resource: string;
    actions: string[];
}

// Address Sub-document
const AddressSchema = new Schema({
    region: { type: String },
    zone: { type: String },
    woreda: { type: String },
    city: { type: String },
    kebele: { type: String },
}, { _id: false });

// Organization Interface
export interface IOrganization extends Document {
    name: string;
    type: OrganizationType;
    academic_level?: AcademicLevel;
    classification?: Classification;
    ownership?: Ownership;
    address?: {
        region?: string;
        zone?: string;
        woreda?: string;
        city?: string;
        kebele?: string;
    };
    category?: Category;
    parent?: Types.ObjectId;
    permissions?: Permission[];
    createdAt?: Date;
    updatedAt?: Date;
}

// Organization Schema
const OrganizationSchema = new Schema<IOrganization>({
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(OrganizationType), required: true, immutable: true },

    academic_level: { type: String, enum: Object.values(AcademicLevel) },
    classification: { type: String, enum: Object.values(Classification) },
    ownership: { type: String, enum: Object.values(Ownership) },

    address: { type: AddressSchema },

    category: { type: String, enum: Object.values(Category) },

    parent: { type: Schema.Types.ObjectId, ref: 'Organization' },

    permissions: [{
        resource: { type: String },
        actions: [{ type: String }]
    }],

}, { timestamps: true });


export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
