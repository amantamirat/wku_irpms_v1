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

// Enum for Position Category
export enum Category {
    Academic = 'academic',
    Supportive = 'supportive',
    External = 'external',
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

    parent: { type: Schema.Types.ObjectId, ref: 'Organization' }

}, { timestamps: true });


OrganizationSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const orgId = this._id;
    const hasChildren = await mongoose.model('Organization').exists({ parent: orgId });
    if (hasChildren) {
        const err = new Error(`Cannot delete: ${this.name} ${this.type} it is a parent for other organizations.`);
        return next(err);
    }
    const isReferenced = await mongoose.model('Applicant').exists({ organization: orgId });
    if (isReferenced) {
        const err = new Error(`Cannot delete: ${this.name} ${this.type} it is a workspace for some applicants.`);
        return next(err);
    }
    next();
});

const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
