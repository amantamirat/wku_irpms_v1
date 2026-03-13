import mongoose, { Document, Schema, model } from 'mongoose';
import { Gender, Accessibility } from './applicant.enum';
import { COLLECTIONS } from '../../common/constants/collections.enum';
import { Unit } from '../../common/constants/enums';


export interface IOwnership {
    unitType: Unit;          // College | Department | Directorate | ...
    scope: string[] | "*";   // resource IDs OR wildcard
}

export interface IApplicant extends Document {
    workspace: mongoose.Types.ObjectId;
    name: string;
    birthDate: Date;
    gender: Gender;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    specializations?: mongoose.Types.ObjectId[];
    roles: mongoose.Types.ObjectId[];
    ownerships: IOwnership[];
    createdAt?: Date;
    updatedAt?: Date;
}

const OwnershipSchema = new Schema<IOwnership>(
    {
        unitType: {
            type: String,
            enum: Object.values(Unit),
            required: true
        },
        scope: {
            type: Schema.Types.Mixed,
            required: true
        }
    },
    { _id: false }
);

const ApplicantSchema = new Schema<IApplicant>({
    workspace: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: true
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
    //no compeletion date is specified here
    specializations: [{
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.SPECIALIZATION
    }],
    roles: [{
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ROLE
    }],
    ownerships: {
        type: [OwnershipSchema],
        default: []
    }
}, { timestamps: true });

const Applicant = model<IApplicant>(COLLECTIONS.APPLICANT, ApplicantSchema);
export default Applicant;
