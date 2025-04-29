import mongoose, { Schema, model, Document } from 'mongoose';
import { IDepartment } from './department';
import { ISpecialization } from './specialization';
import { IUser } from './user'; 

// Gender Enum
export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

// Applicant Type Enum
export enum ApplicantType {
    Student = 'Student',
    Instructor = 'Instructor',
    Assistance = 'Assistance',
    Administrator = 'Administrator',
    External = 'External'
}

// Interface
export interface IApplicant extends Document {
    department: mongoose.Types.ObjectId;
    specialization?: mongoose.Types.ObjectId;
    first_name: string;
    middle_name?: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    type: ApplicantType;
    user_id?: mongoose.Types.ObjectId;
}

const ApplicantSchema = new Schema<IApplicant>({
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    specialization: {
        type: Schema.Types.ObjectId,
        ref: 'Specialization',
        required: false
    },
    first_name: {
        type: String,
        required: true
    },
    middle_name: {
        type: String,
        required: false
    },
    last_name: {
        type: String,
        required: true
    },
    birth_date: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: Object.values(Gender),
        required: true
    },
    type: {
        type: String,
        enum: Object.values(ApplicantType),
        required: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        immutable: true
    }
});

const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
export default Applicant;
