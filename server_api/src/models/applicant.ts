import mongoose, { Document, Schema, model } from 'mongoose';

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export interface IApplicant extends Document {
    first_name: string;
    middle_name?: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    department?: mongoose.Types.ObjectId;
    position?: mongoose.Types.ObjectId;
    rank?: mongoose.Types.ObjectId;
    hire_date?: Date;
    institute?: mongoose.Types.ObjectId;
    is_external?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const ApplicantSchema = new Schema<IApplicant>({
    first_name: {
        type: String,
        required: true
    },
    middle_name: {
        type: String,
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
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
    },
    position: {
        type: Schema.Types.ObjectId,
        ref: 'Position',
    },
    rank: {
        type: Schema.Types.ObjectId,
        ref: 'Rank',
    },
    hire_date: {
        type: Date,
    },
    institute: {
        type: Schema.Types.ObjectId,
        ref: 'Institute',
    },
    is_external: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
export default Applicant;
