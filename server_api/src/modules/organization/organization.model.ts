import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../util/collections.enum";
import { AcademicLevel, Classification, Ownership, Unit } from "./organization.enum";


interface OrganizationDocument extends Document {
    type: Unit;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const OrganizationSchema = new Schema<OrganizationDocument>(
    {
        type: { type: String, enum: Object.values(Unit), required: true },
        name: { type: String, required: true }
    },
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

export const Organization = model<OrganizationDocument>(COLLECTIONS.ORGANIZATION, OrganizationSchema);

interface CollegeDocument extends OrganizationDocument {
    type: Unit.College;
}
export const College = Organization.discriminator<CollegeDocument>(Unit.College, new Schema({}));

interface DirectorateDocument extends OrganizationDocument {
    type: Unit.Directorate;
}

export const Directorate = Organization.discriminator<DirectorateDocument>(Unit.Directorate, new Schema({}));

interface OfficeDocument extends OrganizationDocument {
    type: Unit.Supportive;
}

export const Office = Organization.discriminator<OfficeDocument>(Unit.Supportive, new Schema({}));


interface SectorDocument extends OrganizationDocument {
    type: Unit.Sector;
}

export const Sector = Organization.discriminator<SectorDocument>(Unit.Sector, new Schema({}));


export interface SpecializationDocument extends OrganizationDocument {
    type: Unit.Specialization;
    academic_level: AcademicLevel;
}

const SpecializationSchema = new Schema<SpecializationDocument>({
    academic_level: { type: String, enum: Object.values(AcademicLevel), required: true },
});

export const Specialization = Organization.discriminator<SpecializationDocument>(Unit.Specialization, SpecializationSchema);



interface ChildOrganizationDocument extends OrganizationDocument {
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

export const Department = Organization.discriminator<DepartmentDocument>(Unit.Department, DepartmentSchema);

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

export const Center = Organization.discriminator<CenterDocument>(Unit.Center, CenterSchema);


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

export const Program = Organization.discriminator<ProgramDocument>(Unit.Program, ProgramSchema);

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

export const External = Organization.discriminator<ExternalDocument>(Unit.External, ExternalSchema);

