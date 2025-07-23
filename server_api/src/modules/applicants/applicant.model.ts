import mongoose, { Document, Schema, model } from 'mongoose';

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export enum Scope {
    academic = 'academic',
    supportive = 'supportive',
    external = 'external',
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
    last_name: string;
    birth_date: Date;
    gender: Gender;
    scope: Scope;
    organization: mongoose.Types.ObjectId;
    disability?: {
        hasDisability?: boolean,
        disabilityTypes?: DisabilityTypes,
    }
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
    scope: {
        type: String,
        enum: Object.values(Scope),
        required: true
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    disability: {
        hasDisability: {
            type: Boolean,
            default: false
        },
        disabilityTypes: {
            type: String,
            enum: Object.values(DisabilityTypes),
        },
    }
}, { timestamps: true });

const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
export default Applicant;
