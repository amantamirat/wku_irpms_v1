import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum VerificationStatus {
    submitted = "submitted",
    under_review = "under_review",
    verified = "verified",
    failed = "failed"
}

export interface IVerification extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    configuration: mongoose.Types.ObjectId;
    attempt: number;
    status: VerificationStatus;
    submittedBy: mongoose.Types.ObjectId;
    documentPath: string;
    submittedAt?: Date;
    reviewedAt?: Date;
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const VerificationSchema =
    new Schema<IVerification>(
        {
            project: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.PROJECT,
                required: true,
            },

            configuration: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.VERIFICATION_CONFIGURATION,
                required: true,
            },

            attempt: {
                type: Number,
                required: true,
                min: 1,
            },

            status: {
                type: String,
                enum: Object.values(VerificationStatus),
                default: VerificationStatus.submitted,
                required: true,
            },

            submittedBy: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.USER,
                required: true,
            },

            documentPath: {
                type: String,
                required: true,
            },

            submittedAt: {
                type: Date,
            },

            reviewedAt: {
                type: Date,
            },

            remarks: {
                type: String,
            },
        },
        {
            timestamps: true,
        }
    );

VerificationSchema.index(
    {
        project: 1,
        attempt: 1
    },
    {
        unique: true
    }
);

export const Verification =
    model<IVerification>(
        COLLECTIONS.VERIFICATION,
        VerificationSchema
    );