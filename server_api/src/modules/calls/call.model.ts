import mongoose, { Document, Schema, model } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { CallStatus } from "./call.status";

export interface ICall extends Document {
    organization: mongoose.Types.ObjectId;//grant.organization
    grantAllocation: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    budget?: number;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallSchema = new Schema<ICall>(
    {
        grantAllocation: { type: Schema.Types.ObjectId, ref: COLLECTIONS.GRANT_ALLOCATION, required: true },
        organization: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGANIZATION, required: true },
        title: { type: String, required: true },
        description: { type: String },
        budget: {
            type: Number,
            //required: true,
            min: 0,
        },
        status: { type: String, enum: Object.values(CallStatus), required: true },
    },
    { timestamps: true }
);


export const Call = model<ICall>(COLLECTIONS.CALL, CallSchema);
