import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { Classification, Ownership } from "./organization.enum";
import { AcademicLevel, Unit } from "../../common/constants/enums";


export interface IOrganization extends Document {
    type: Unit;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
    {
        type: { type: String, enum: Object.values(Unit), required: true },
        name: { type: String, required: true }
    },
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

export const Organization = model<IOrganization>(COLLECTIONS.ORGANIZATION, OrganizationSchema);

interface ICollege extends IOrganization {
    type: Unit.College;
}
export const College = Organization.discriminator<ICollege>(Unit.College, new Schema({}));

interface IDirectorate extends IOrganization {
    type: Unit.Directorate;
}

export const Directorate = Organization.discriminator<IDirectorate>(Unit.Directorate, new Schema({}));

interface IExternal extends IOrganization {
    type: Unit.External;
    ownership: Ownership;
}

const ExternalSchema = new Schema<IExternal>({
    ownership: { type: String, enum: Object.values(Ownership), required: true }
});

export const External = Organization.discriminator<IExternal>(Unit.External, ExternalSchema);


interface SubOrganizationDocument extends IOrganization {
    parent: mongoose.Types.ObjectId;
}

interface DepartmentDocument extends SubOrganizationDocument {
    type: Unit.Department;
}

const DepartmentSchema = new Schema<DepartmentDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: College.modelName,
        required: true
    }
});

export const Department = Organization.discriminator<DepartmentDocument>(Unit.Department, DepartmentSchema);

interface CenterDocument extends SubOrganizationDocument {
    type: Unit.Center;
}

const CenterSchema = new Schema<CenterDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: Directorate.modelName,
        required: true
    }
});

export const Center = Organization.discriminator<CenterDocument>(Unit.Center, CenterSchema);

interface ProgramDocument extends SubOrganizationDocument {
    type: Unit.Program;
    academicLevel: AcademicLevel;
    classification: Classification;
}

const ProgramSchema = new Schema<ProgramDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: Department.modelName,
        required: true
    },
    academicLevel: {
        type: String,
        enum: Object.values(AcademicLevel),
        required: true
    },
    classification: {
        type: String,
        enum: Object.values(Classification),
        required: true
    },
});

export const Program = Organization.discriminator<ProgramDocument>(Unit.Program, ProgramSchema);


