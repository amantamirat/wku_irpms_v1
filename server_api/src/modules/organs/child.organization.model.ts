import { Schema, Types } from "mongoose";
import { BaseOrganization, BaseOrganizationDocument } from "./organization.model";
import { COLLECTIONS } from "../../enums/collections.enum";
import { AcademicLevel } from "./enums/academicLevel.enum";
import { Classification } from "./enums/classification.enum";
import { Ownership } from "./enums/ownership.enum";
import { Unit } from "./enums/unit.enum";



export interface ChildOrganizationDocument extends BaseOrganizationDocument {
    parent: Types.ObjectId;
}

const ChildOrganizationSchema = new Schema<ChildOrganizationDocument>({
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGAN, required: true }
});

interface DepartmentDocument extends ChildOrganizationDocument {
    type: Unit.College;
}

interface CenterDocument extends ChildOrganizationDocument {
    type: Unit.Center;
}

interface RankDocument extends ChildOrganizationDocument {
    type: Unit.Rank;
}

interface ProgramDocument extends ChildOrganizationDocument {
    type: Unit.Program;
    academic_level: AcademicLevel;
    classification: Classification;
}

const ProgramSchema = new Schema<ProgramDocument>({
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGAN, required: true },
    academic_level: { type: String, enum: Object.values(AcademicLevel), required: true },
    classification: { type: String, enum: Object.values(Classification), required: true },
});

interface ExternalDocument extends ChildOrganizationDocument {
    type: Unit.External;
    ownership: Ownership;
}

const ExternalSchema = new Schema<ExternalDocument>({
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGAN, required: true },
    ownership: { type: String, enum: Object.values(Ownership), required: true }
});

export const Department = BaseOrganization.discriminator<DepartmentDocument>(Unit.Department, ChildOrganizationSchema);
export const Center = BaseOrganization.discriminator<CenterDocument>(Unit.Center, ChildOrganizationSchema);
export const Rank = BaseOrganization.discriminator<RankDocument>(Unit.Rank, ChildOrganizationSchema);
export const Program = BaseOrganization.discriminator<ProgramDocument>(Unit.Program, ProgramSchema);
export const External = BaseOrganization.discriminator<ExternalDocument>(Unit.External, ExternalSchema);



