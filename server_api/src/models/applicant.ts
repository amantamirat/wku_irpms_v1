import mongoose, { Document, Schema, model } from 'mongoose';

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export interface IApplicant extends Document {
    department?: mongoose.Types.ObjectId;
    first_name: string;
    middle_name?: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    is_external: boolean;
    position?: mongoose.Types.ObjectId;
    positionStatus?: mongoose.Types.ObjectId;
    hire_date?: Date;
}

const ApplicantSchema = new Schema<IApplicant>({
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
    },
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
    is_external: {
        type: Boolean,
        default: false
    },
    position: {
        type: Schema.Types.ObjectId,
        ref: 'Position',
    },
    positionStatus: {
        type: Schema.Types.ObjectId,
        ref: 'PositionStatus',
    },
    hire_date: {
        type: Date,
    },
});

const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
export default Applicant;
