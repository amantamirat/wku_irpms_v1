import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum VerificationStatus {
    submitted = "submitted",
    verified = "verified",
    failed = "failed"
}

export interface IVerification extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    configuration: mongoose.Types.ObjectId;
    attempt: number;
    status: VerificationStatus;
    documentPath: string;
    totalScore: number | null;

    //submittedAt?: Date;
    reviewedAt?: Date;
    //submittedBy?: mongoose.Types.ObjectId;
    //remarks?: string;
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
/*
            submittedBy: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.USER,
                required: true,
            },
            
            submittedAt: {
                type: Date,
            },
             remarks: {
                type: String,
            },
            */

            documentPath: {
                type: String,
                required: true,
            },

            totalScore: {
                type: Number,
                min: 0,
                default: null
            },

            

            reviewedAt: {
                type: Date,
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