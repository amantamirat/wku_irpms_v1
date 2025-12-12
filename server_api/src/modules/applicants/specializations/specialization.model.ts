import mongoose, { Schema } from "mongoose";
import { AcademicLevel } from "../../../common/constants/enums";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export interface ISpecialization extends Document {
    name: string,
    academicLevel: AcademicLevel;
    createdAt?: Date;
    updatedAt?: Date;
}

const SpecializationSchema = new Schema<ISpecialization>({
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

export const Specialization = mongoose.model<ISpecialization>(COLLECTIONS.SPECIALIZATION, SpecializationSchema);