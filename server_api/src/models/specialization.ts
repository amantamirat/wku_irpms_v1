import mongoose, { Schema, model, Document } from 'mongoose';


export interface ISpecialization extends Document {
    department: mongoose.Types.ObjectId; // Reference to the Department model
    specialization_name: string;
    academic_level: 'BA' | 'BSc' | 'MA' | 'MSc' | 'PhD'; // Enum-like string values for academic level
}


const SpecializationSchema = new Schema<ISpecialization>({
    department: {
        type: Schema.Types.ObjectId, // ObjectId reference to the Department model
        ref: 'Department', // Reference to the Department model
        required: true
    },
    specialization_name: {
        type: String,
        required: true
    },
    academic_level: {
        type: String,
        enum: ['BA', 'BSc', 'MA', 'MSc', 'PhD'], // Restrict academic level to valid values
        required: true
    }
});


const Specialization = model<ISpecialization>('Specialization', SpecializationSchema);
export default Specialization;
