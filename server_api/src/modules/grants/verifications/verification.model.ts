import mongoose, { Schema, model } from 'mongoose';
import { CallStatus } from "../../calls/call.model";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export interface IVerification extends Document {
    grant: mongoose.Types.ObjectId;
    deadline: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

const VerificationSchema = new Schema<IVerification>(
    {
        grant: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.GRANT,
            required: true,
            index: true
        },

        deadline: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Verification = model<IVerification>(
    COLLECTIONS.VERIFICATION,
    VerificationSchema
);