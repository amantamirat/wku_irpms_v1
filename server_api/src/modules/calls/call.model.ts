import mongoose, { Document, Schema, model } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export enum CallStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export interface ICall extends Document {
    organization: mongoose.Types.ObjectId;
    calendar: mongoose.Types.ObjectId;
    grant: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    constraint?: mongoose.Types.ObjectId;
    composition?: mongoose.Types.ObjectId;
    deadline?: Date | null;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallSchema = new Schema<ICall>(
    {
        calendar: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.CALENDAR,
            required: true,
            immutable: true,
        },
        grant: { type: Schema.Types.ObjectId, ref: COLLECTIONS.GRANT, required: true },
        organization: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGANIZATION, required: true },
        title: { type: String, required: true },
        constraint: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.CONSTRAINT,
            required: false,
        },

        composition: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.COMPOSITION,
            required: false,
        },
        description: { type: String },
        deadline: { type: Date },
        status: { type: String, enum: Object.values(CallStatus), required: true },
    },
    { timestamps: true }
);


export const Call = model<ICall>(COLLECTIONS.CALL, CallSchema);

