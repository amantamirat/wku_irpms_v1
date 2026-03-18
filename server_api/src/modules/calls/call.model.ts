import mongoose, { Document, Schema, model } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { CallStatus } from "./call.status";

export interface ICall extends Document {
    calendar: mongoose.Types.ObjectId;
    //directorate: mongoose.Types.ObjectId;
    grant: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    //thematic: mongoose.Types.ObjectId;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallSchema = new Schema<ICall>(
    {
        calendar: { type: Schema.Types.ObjectId, ref: COLLECTIONS.CALENDAR, required: true },
        /**
         *  directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGANIZATION, required: true },
         *  thematic: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEMATIC },
         */
        grant: { type: Schema.Types.ObjectId, ref: COLLECTIONS.GRANT, required: true },
        title: { type: String, required: true },
        description: { type: String },

        status: { type: String, enum: Object.values(CallStatus), required: true },
    },
    { timestamps: true }
);


export const Call = model<ICall>(COLLECTIONS.CALL, CallSchema);
