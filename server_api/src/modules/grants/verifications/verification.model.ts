import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../common/schemas/status-history.schema";

export enum VerificationStatus {
    submitted = "submitted",
    verified = "verified",
    rejected = "rejected"
}

export interface IVerification extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    configuration: mongoose.Types.ObjectId;
    attempt: number;
    documentPath: string;
    totalScore: number | null;
    reviewedAt?: Date;
    status: VerificationStatus;
    statusHistory: IStatusHistory<VerificationStatus>[];
    createdAt?: Date;
    updatedAt?: Date;
}

const VerificationStatusHistorySchema =
    createStatusHistorySchema(
        Object.values(VerificationStatus)
    );

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
            status: {
                type: String,
                enum: Object.values(VerificationStatus),
                default: VerificationStatus.submitted,
                required: true,
            },
            statusHistory: {
                type: [VerificationStatusHistorySchema],
                default: []
            }

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