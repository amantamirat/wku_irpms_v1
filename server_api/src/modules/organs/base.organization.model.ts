import { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { AcademicLevel } from "./enums/academicLevel.enum";
import { Category } from "./enums/category.enum";
import { Unit } from "./enums/unit.enum";

export interface BaseOrganizationDocument extends Document {
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

