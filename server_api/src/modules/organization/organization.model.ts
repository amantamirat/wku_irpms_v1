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
export const College = BaseOrganization.discriminator<CollegeDocument>(Unit.College, new Schema({}));

interface DirectorateDocument extends BaseOrganizationDocument {
    type: Unit.Directorate;
}

export const Directorate = BaseOrganization.discriminator<DirectorateDocument>(Unit.Directorate, new Schema({}));

interface OfficeDocument extends BaseOrganizationDocument {
    type: Unit.Supportive;
}

export const Office = BaseOrganization.discriminator<OfficeDocument>(Unit.Supportive, new Schema({}));


interface SectorDocument extends BaseOrganizationDocument {
    type: Unit.Sector;
}

export const Sector = BaseOrganization.discriminator<SectorDocument>(Unit.Sector, new Schema({}));


export interface SpecializationDocument extends BaseOrganizationDocument {
    type: Unit.Specialization;
    academic_level: AcademicLevel;
}

const SpecializationSchema = new Schema<SpecializationDocument>({
    academic_level: { type: String, enum: Object.values(AcademicLevel), required: true },
});

export const Specialization = BaseOrganization.discriminator<SpecializationDocument>(Unit.Specialization, SpecializationSchema);

interface PositionDocument extends BaseOrganizationDocument {
    type: Unit.Position;
    category: Category;
}

const PositionSchema = new Schema<PositionDocument>({
    category: { type: String, enum: Object.values(Category), required: true },
});

export const Position = BaseOrganization.discriminator<PositionDocument>(Unit.Position, PositionSchema);

interface ChildOrganizationDocument extends BaseOrganizationDocument {
    parent: mongoose.Types.ObjectId;
}

interface DepartmentDocument extends ChildOrganizationDocument {
    type: Unit.Department;
}

const DepartmentSchema = new Schema<DepartmentDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: College.modelName,
        required: true,
        validate: {
            validator: async function (parentId: mongoose.Types.ObjectId) {
                const exist = await College.exists({ _id: parentId });
                return !!exist;
            },
            message: "Department must belong to a College",
        },
    }
});

export const Department = BaseOrganization.discriminator<DepartmentDocument>(Unit.Department, DepartmentSchema);

interface CenterDocument extends ChildOrganizationDocument {
    type: Unit.Center;
}

const CenterSchema = new Schema<CenterDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: Directorate.modelName,
        required: true,
        validate: {
            validator: async function (parentId: mongoose.Types.ObjectId) {
                const exist = await Directorate.exists({ _id: parentId });
                return !!exist;
            },
            message: "Center must belong to a Directorate",
        },
    }
});

export const Center = BaseOrganization.discriminator<CenterDocument>(Unit.Center, CenterSchema);

interface RankDocument extends ChildOrganizationDocument {
    type: Unit.Rank;
}

const RankSchema = new Schema<RankDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: Position.modelName,
        required: true,
        validate: {
            validator: async function (parentId: mongoose.Types.ObjectId) {
                const exist = await Position.exists({ _id: parentId });
                return !!exist;
            },
            message: "Rank must belong to a Position",
        },
    }
});

export const Rank = BaseOrganization.discriminator<RankDocument>(Unit.Rank, RankSchema);

interface ProgramDocument extends ChildOrganizationDocument {
    type: Unit.Program;
    academic_level: AcademicLevel;
    classification: Classification;
}

const ProgramSchema = new Schema<ProgramDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: Department.modelName,
        required: true,
        validate: {
            validator: async function (parentId: mongoose.Types.ObjectId) {
                const exist = await Department.exists({ _id: parentId });
                return !!exist;
            },
            message: "Program must belong to a Department",
        },
    },
    academic_level: {
        type: String,
        enum: Object.values(AcademicLevel),
        required: true
    },
    classification: { 
        type: String, 
        enum: Object.values(Classification), 
        required: true },
});

export const Program = BaseOrganization.discriminator<ProgramDocument>(Unit.Program, ProgramSchema);

interface ExternalDocument extends ChildOrganizationDocument {
    type: Unit.External;
    ownership: Ownership;
}

const ExternalSchema = new Schema<ExternalDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: Sector.modelName,
        required: true,
        validate: {
            validator: async function (parentId: mongoose.Types.ObjectId) {
                const exist = await Sector.exists({ _id: parentId });
                return !!exist;
            },
            message: "External Organization must belong to a Sector",
        },
    },
    ownership: { type: String, enum: Object.values(Ownership), required: true }
});

export const External = BaseOrganization.discriminator<ExternalDocument>(Unit.External, ExternalSchema);

