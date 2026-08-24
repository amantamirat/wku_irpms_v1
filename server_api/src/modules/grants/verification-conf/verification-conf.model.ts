import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";


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
    status: VerificationConfigurationStatus;
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

            status: {
                type: String,
                enum: Object.values(
                    VerificationConfigurationStatus
                ),
                default: VerificationConfigurationStatus.active,
                required: true
            }
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