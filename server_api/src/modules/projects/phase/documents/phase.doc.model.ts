import mongoose, { Schema } from "mongoose";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export enum PhaseDocumentType {
    plan = "plan",
    progressReport = "progressReport",
    technicalReport = "technicalReport",
    financialReport = "financialReport",
    activityEvidence = "activityEvidence",
    deliverable = "deliverable",
    meetingMinutes = "meetingMinutes",
    attendance = "attendance",
    photo = "photo",
    dataset = "dataset",
    completionReport = "completionReport",
    other = "other"
}

export interface IPhaseDocument extends Document {
    phase: mongoose.Types.ObjectId;
    type: PhaseDocumentType;
    description: string;
    documentPath: string;

    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;
}

const PhaseDocSchema = new mongoose.Schema<IPhaseDocument>({
    phase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: COLLECTIONS.PHASE,
        required: true,
        immutable: true
    },

    type: {
        type: String,
        enum: Object.values(PhaseDocumentType),
        required: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    documentPath: {
        type: String,
        required: true
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER
    },

    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.USER
    }

}, { timestamps: true });

export const PhaseDocument = mongoose.model<IPhaseDocument>(COLLECTIONS.PHASE_DOCUMENT, PhaseDocSchema);
