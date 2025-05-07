import mongoose, { Schema, model, Document } from 'mongoose';


export enum AcademicLevel {
    Certificate = 'Certificate',
    Diploma = 'Diploma',
    BA = 'BA',
    BSc = 'BSc',
    BT = 'BT',
    MA = 'MA',
    MSc = 'MSc',
    MPhil = 'MPhil',
    MT = 'MT',
    PhD = 'PhD',
    PostDoc = 'PostDoc'
}

export interface ISpecialization extends Document {
    department: mongoose.Types.ObjectId;
    specialization_name: string;
    academic_level: AcademicLevel
}


const SpecializationSchema = new Schema<ISpecialization>({
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
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

SpecializationSchema.index({ department: 1, specialization_name: 1 }, { unique: true });
const Specialization = model<ISpecialization>('Specialization', SpecializationSchema);
export default Specialization;
