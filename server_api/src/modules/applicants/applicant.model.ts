import mongoose, { Document, Schema, model } from 'mongoose';
import { Gender } from './enums/gender.enum';
import { Accessibility } from './enums/accessibility.enum';
import { COLLECTIONS } from '../../enums/collections.enum';
import { Category } from '../organs/enums/category.enum';

export interface IApplicant extends Document {
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    scope: Category;
    organization: mongoose.Types.ObjectId;
    user?: mongoose.Types.ObjectId;
    accessibility?: Accessibility[];
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
        enum: Object.values(Category),
        required: true
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGAN,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
        unique: true,
        sparse: true
    },
    accessibility: {
        type: [String],
        enum: Object.values(Accessibility),
        default: []
    }
}, { timestamps: true });

const Applicant = model<IApplicant>('Applicant', ApplicantSchema);
export default Applicant;
