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
    positionRank?: mongoose.Types.ObjectId;
    hire_date?: Date;
    is_external: boolean;
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
    positionRank: {
        type: Schema.Types.ObjectId,
        ref: 'PositionRank',
    },
    hire_date: {
        type: Date,
    },
    is_external: {
        type: Boolean,
        default: false
    }
});

const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
export default Applicant;
