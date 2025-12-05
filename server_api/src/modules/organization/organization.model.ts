import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../util/collections.enum";
import { AcademicLevel, Classification, Ownership, Unit } from "./organization.enum";

interface IBaseOrganization extends Document {
    type: Unit;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const OrganizationSchema = new Schema<IBaseOrganization>(
    {
        type: { type: String, enum: Object.values(Unit), required: true },
        name: { type: String, required: true }
    },
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

export const Organization = model<IBaseOrganization>(COLLECTIONS.ORGANIZATION, OrganizationSchema);

interface ICollege extends IBaseOrganization {
    type: Unit.College;
}
export const College = Organization.discriminator<ICollege>(Unit.College, new Schema({}));

interface IDirectorate extends IBaseOrganization {
    type: Unit.Directorate;
}

export const Directorate = Organization.discriminator<IDirectorate>(Unit.Directorate, new Schema({}));

interface ExternalDocument extends IBaseOrganization {
    type: Unit.External;
    ownership: Ownership;
}

const ExternalSchema = new Schema<ExternalDocument>({
    ownership: { type: String, enum: Object.values(Ownership), required: true }
});

export const External = Organization.discriminator<ExternalDocument>(Unit.External, ExternalSchema);



/*
interface OfficeDocument extends IOrganization {
    type: Unit.Supportive;
}
export const Office = Organization.discriminator<OfficeDocument>(Unit.Supportive, new Schema({}));
*/

/*
interface ISector extends IBaseOrganization {
    type: Unit.Sector;
}

export const Sector = Organization.discriminator<ISector>(Unit.Sector, new Schema({}));
*/
/*
export interface ISpecialization extends IBaseOrganization {
    type: Unit.Specialization;
    academic_level: AcademicLevel;
}

const SpecializationSchema = new Schema<ISpecialization>({
    academic_level: { type: String, enum: Object.values(AcademicLevel), required: true },
});

export const Specialization = Organization.discriminator<ISpecialization>(Unit.Specialization, SpecializationSchema);
*/


interface SubOrganizationDocument extends IBaseOrganization {
    parent: mongoose.Types.ObjectId;
}

interface DepartmentDocument extends SubOrganizationDocument {
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

interface CenterDocument extends SubOrganizationDocument {
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


interface ProgramDocument extends SubOrganizationDocument {
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
        required: true
    },
});

export const Program = Organization.discriminator<ProgramDocument>(Unit.Program, ProgramSchema);


