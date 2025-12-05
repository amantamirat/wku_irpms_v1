import { AcademicLevel } from "../../organization/organization.enum";

export interface ISpecialization extends Document {
    name: string,
    academicLevel: AcademicLevel;
    createdAt?: Date;
    updatedAt?: Date;
}