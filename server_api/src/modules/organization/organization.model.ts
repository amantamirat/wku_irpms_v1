import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { AcademicLevel, Category, Classification, Ownership, Unit } from "./organization.enum";


interface BaseOrganizationDocument extends Document {
    type: Unit;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const BaseOrganizationSchema = new Schema<BaseOrganizationDocument>(
    {
        type: { type: String, enum: Object.values(Unit), required: true },
        name: { type: String, required: true }
    },
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

export const BaseOrganization = model<BaseOrganizationDocument>(COLLECTIONS.ORGAN, BaseOrganizationSchema);

interface CollegeDocument extends BaseOrganizationDocument {
    type: Unit.College;
}

interface DirectorateDocument extends BaseOrganizationDocument {
    type: Unit.Directorate;
}

interface OfficeDocument extends BaseOrganizationDocument {
    type: Unit.Supportive;
}

interface SectorDocument extends BaseOrganizationDocument {
    type: Unit.Sector;
}

export interface SpecializationDocument extends BaseOrganizationDocument {
    type: Unit.Specialization;
    academic_level: AcademicLevel;
}

const SpecializationSchema = new Schema<SpecializationDocument>({
    academic_level: { type: String, enum: Object.values(AcademicLevel), required: true },
});

interface PositionDocument extends BaseOrganizationDocument {
    type: Unit.Position;
    category: Category;
}

const PositionSchema = new Schema<PositionDocument>({
    category: { type: String, enum: Object.values(Category), required: true },
});

// Create base discriminators
export const College = BaseOrganization.discriminator<CollegeDocument>(Unit.College, new Schema({}));
export const Directorate = BaseOrganization.discriminator<DirectorateDocument>(Unit.Directorate, new Schema({}));
export const Office = BaseOrganization.discriminator<OfficeDocument>(Unit.Supportive, new Schema({}));
export const Sector = BaseOrganization.discriminator<SectorDocument>(Unit.Sector, new Schema({}));
export const Specialization = BaseOrganization.discriminator<SpecializationDocument>(Unit.Specialization, SpecializationSchema);
export const Position = BaseOrganization.discriminator<PositionDocument>(Unit.Position, PositionSchema);

interface ChildOrganizationDocument extends BaseOrganizationDocument {
    parent: mongoose.Types.ObjectId;
}

interface DepartmentDocument extends ChildOrganizationDocument {
    type: Unit.Department;
}

const DepartmentSchema = new Schema<DepartmentDocument>({
    parent: { type: Schema.Types.ObjectId, ref: College.modelName, required: true }
});

export const Department = BaseOrganization.discriminator<DepartmentDocument>(Unit.Department, DepartmentSchema);

interface CenterDocument extends ChildOrganizationDocument {
    type: Unit.Center;
}

const CenterSchema = new Schema<CenterDocument>({
    parent: { type: Schema.Types.ObjectId, ref: Directorate.modelName, required: true }
});

export const Center = BaseOrganization.discriminator<CenterDocument>(Unit.Center, CenterSchema);

interface RankDocument extends ChildOrganizationDocument {
    type: Unit.Rank;
}

const RankSchema = new Schema<RankDocument>({
    parent: { type: Schema.Types.ObjectId, ref: Position.modelName, required: true }
});

export const Rank = BaseOrganization.discriminator<RankDocument>(Unit.Rank, RankSchema);

interface ProgramDocument extends ChildOrganizationDocument {
    type: Unit.Program;
    academic_level: AcademicLevel;
    classification: Classification;
}

const ProgramSchema = new Schema<ProgramDocument>({
    parent: { type: Schema.Types.ObjectId, ref: Rank.modelName, required: true },
    academic_level: { type: String, enum: Object.values(AcademicLevel), required: true },
    classification: { type: String, enum: Object.values(Classification), required: true },
});

export const Program = BaseOrganization.discriminator<ProgramDocument>(Unit.Program, ProgramSchema);

interface ExternalDocument extends ChildOrganizationDocument {
    type: Unit.External;
    ownership: Ownership;
}

const ExternalSchema = new Schema<ExternalDocument>({
    parent: { type: Schema.Types.ObjectId, ref: Sector.modelName, required: true },
    ownership: { type: String, enum: Object.values(Ownership), required: true }
});

export const External = BaseOrganization.discriminator<ExternalDocument>(Unit.External, ExternalSchema);

