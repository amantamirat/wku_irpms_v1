import mongoose, { Document, Schema, model } from 'mongoose';
import { Gender, Accessibility } from './applicant.enum';
import { COLLECTIONS } from '../../util/collections.enum';



export interface IApplicant extends Document {
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    organization: mongoose.Types.ObjectId;
    email?: string;
    user?: mongoose.Types.ObjectId;
    accessibility?: Accessibility[];
    //ORCID
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
    organization: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        required: true
    },
    email: {
        type: String,
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
        sparse: true
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

const Applicant = model<IApplicant>(COLLECTIONS.APPLICANT, ApplicantSchema);
export default Applicant;
