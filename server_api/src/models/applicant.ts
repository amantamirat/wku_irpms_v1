import mongoose, { Document, Schema, model } from 'mongoose';

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export enum DisabilityTypes {
    Visual = 'Visual',
    Hearing = 'Hearing',
    Mobility = 'Mobility',
    Speech = 'Speech',
    Cognitive = 'Cognitive',
    Other = 'Other'
}

export interface IApplicant extends Document {
    first_name: string;
    middle_name?: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    rank: mongoose.Types.ObjectId;
    department?: mongoose.Types.ObjectId;
    organization?: mongoose.Types.ObjectId;
    hasDisability?: boolean,
    disabilityTypes?: DisabilityTypes,
    hire_date?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const ApplicantSchema = new Schema<IApplicant>({
    first_name: {
        type: String,
        required: true
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
    rank: {
        type: Schema.Types.ObjectId,
        ref: 'Rank',
        required: true
    },
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
    },
    hasDisability: {
        type: Boolean,
        default: false
    },
    disabilityTypes: {
        type: String,
        enum: Object.values(DisabilityTypes),
    },
    hire_date: {
        type: Date,
    }
}, { timestamps: true });

const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
export default Applicant;
