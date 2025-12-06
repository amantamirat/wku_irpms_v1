import mongoose, { Document, Schema, model } from 'mongoose';
import { Gender, Accessibility } from './applicant.enum';
import { COLLECTIONS } from '../../util/collections.enum';

export interface IApplicant extends Document {
    workspace?: mongoose.Types.ObjectId;
    name: string;
    birthDate: Date;
    gender: Gender;
    email: string;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    roles?: mongoose.Types.ObjectId[];
    ownerships?: mongoose.Types.ObjectId[];
    createdAt?: Date;
    updatedAt?: Date;
}

const ApplicantSchema = new Schema<IApplicant>({
    workspace: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        //required: true
    },
    name: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        //immutable: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ]
    },
    gender: {
        type: String,
        enum: Object.values(Gender),
        required: true
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
    roles: [{
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ROLE
    }],
    ownerships: [{
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION
    }],
}, { timestamps: true });

const Applicant = model<IApplicant>(COLLECTIONS.APPLICANT, ApplicantSchema);
export default Applicant;
