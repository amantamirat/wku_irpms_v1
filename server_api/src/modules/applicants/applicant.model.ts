import mongoose, { Document, Schema, model } from 'mongoose';
import { Gender, Accessibility } from './applicant.enum';
import { COLLECTIONS } from '../../util/collections.enum';


export interface IApplicant extends Document {
    organization: mongoose.Types.ObjectId;
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    email?: string;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    user?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const ApplicantSchema = new Schema<IApplicant>({
    organization: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        required: true
    },
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
    email: {
        type: String,
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
        sparse: true
    },
    fin: {
        type: String,
        unique: true,
        match: [/^\d{12}$/, "Invalid FIN number"],
        sparse: true
    },
    orcid: {
        type: String,
        unique: true,
        sparse: true,
        match: [/^\d{4}-\d{4}-\d{4}-\d{4}$/, "Invalid ORCID format"]
    },
    accessibility: {
        type: [String],
        enum: Object.values(Accessibility),
        default: []
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER,
        unique: true,
        sparse: true,
        //immutable: true
    }
}, { timestamps: true });

const Applicant = model<IApplicant>(COLLECTIONS.APPLICANT, ApplicantSchema);
export default Applicant;
