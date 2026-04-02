import mongoose, { Document, Schema, model } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { CallStatus } from "./call.status";

export interface ICall extends Document {
    grantAllocation: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallSchema = new Schema<ICall>(
    {
        grantAllocation: { type: Schema.Types.ObjectId, ref: COLLECTIONS.GRANT_ALLOCATION, required: true },
        title: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: Object.values(CallStatus), required: true },
    },
    { timestamps: true }
);


export const Call = model<ICall>(COLLECTIONS.CALL, CallSchema);
