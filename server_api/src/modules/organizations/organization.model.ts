import mongoose, { Schema, Document, Types } from 'mongoose';

import Evaluation from '../evaluation/evaluation.model';
import Applicant from '../applicants/applicant.model';
import { AcademicLevel } from './enums/academicLevel.enum';
import { Classification } from './enums/classification.enum';
import { Ownership } from './enums/ownership.enum';
import { Category } from './enums/category.enum';
import { Unit } from './enums/unit.enum';
import { Theme } from '../themes/base.theme.model';

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
    type: Unit;
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
    type: { type: String, enum: Object.values(Unit), required: true, immutable: true },

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
    const isReferencedByApplicant = await Applicant.exists({ organization: orgId });
    if (isReferencedByApplicant) {
        const err = new Error(`Cannot delete: ${this.name} ${this.type} it is a workspace for applicants.`);
        return next(err);
    }
    const isReferencedByTheme = await Theme.exists({ directorate: orgId });
    if (isReferencedByTheme) {
        const err = new Error(`Cannot delete: ${this.name} ${this.type} it is referenced in themes.`);
        return next(err);
    }

    const isReferencedByEval = await Evaluation.exists({ directorate: orgId });
    if (isReferencedByEval) {
        const err = new Error(`Cannot delete: ${this.name} ${this.type} it is referenced in evaluations.`);
        return next(err);
    }
    next();
});

const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
