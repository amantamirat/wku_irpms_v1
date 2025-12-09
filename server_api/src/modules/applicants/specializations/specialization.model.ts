import { Schema } from "mongoose";
import { AcademicLevel } from "../../../common/constants/enums";


export interface ISpecialization extends Document {
    name: string,
    academicLevel: AcademicLevel;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProgramSchema = new Schema<ISpecialization>({
    name: {
        type: String,
        required: true
    },
    academicLevel: {
        type: String,
        enum: Object.values(AcademicLevel),
        required: true
    },
}, { timestamps: true });