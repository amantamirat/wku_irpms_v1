import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { IStatusHistory } from "../../../common/types/status-history";
import { createStatusHistorySchema } from "../../../common/schemas/status-history.schema";


export enum VerificationConfigurationStatus {
    active = "active",
    closed = "closed"
}

export interface IVerificationConfiguration extends Document {
    _id: string;
    grant: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId;
    minReviewers: number;
    maxReviewers: number;
    maxAttempts: number;
    deadline: Date;
    template?: mongoose.Types.ObjectId;
    minAcceptanceScore: number;
    
    status: VerificationConfigurationStatus;
    statusHistory: IStatusHistory<VerificationConfigurationStatus>[];
    
    createdBy?: mongoose.Types.ObjectId; // User who created the record
    updatedBy?: mongoose.Types.ObjectId; // User who last updated the record

    createdAt?: Date;
    updatedAt?: Date;
}

const VerificationConfigurationSchema =
    new Schema<IVerificationConfiguration>(
        {
            grant: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.GRANT,
                required: true,
                unique: true
            },

            evaluation: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.EVALUATION,
                required: true
            },

            deadline: {
                type: Date,
                required: true
            },

            template: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.TEMPLATE
            },

            minReviewers: {
                type: Number,
                required: true,
                min: 1
            },

            maxReviewers: {
                type: Number,
                required: true,
                min: 1
            },

            maxAttempts: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            },

            minAcceptanceScore: {
                type: Number,
                min: 0,
                max: 100,
                default: 50,
                required: true
            },

            status: {
                type: String,
                enum: Object.values(
                    VerificationConfigurationStatus
                ),
                default: VerificationConfigurationStatus.active,
                required: true
            },
            statusHistory: {
                type: [createStatusHistorySchema(Object.values(VerificationConfigurationStatus))],
                default: []
            },
            createdBy: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.USER,
            },
            updatedBy: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.USER,
            },
        },
        {
            timestamps: true
        }
    );

export const VerificationConfiguration =
    model<IVerificationConfiguration>(
        COLLECTIONS.VERIFICATION_CONFIGURATION,
        VerificationConfigurationSchema
    );