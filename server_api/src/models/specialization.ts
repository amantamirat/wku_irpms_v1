import mongoose, { Schema, model, Document } from 'mongoose';
import { AcademicLevel } from './program';


export interface ISpecialization extends Document {
    specialization_name: string;
    academic_level: AcademicLevel
}


const SpecializationSchema = new Schema<ISpecialization>({
    specialization_name: {
        type: String,
        required: true,
        trim: true,
    },
    academic_level: {
        type: String,
        enum: Object.values(AcademicLevel),
        required: true
    }
}, { timestamps: true });

SpecializationSchema.index({specialization_name: 1 }, { unique: true });
const Specialization = model<ISpecialization>('Specialization', SpecializationSchema);
export default Specialization;
