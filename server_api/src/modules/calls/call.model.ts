import mongoose, { Document, Schema, model } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export enum CallStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export interface ICallDeadline {
    submission: Date;
    evaluation: Date;
}

export interface ICall extends Document {
    organization: mongoose.Types.ObjectId;//grant.organization
    calendar: mongoose.Types.ObjectId;
    grant: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    budget: number;
    usedBudget: number;
    deadlines: ICallDeadline[];
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallDeadlineSchema = new mongoose.Schema({
    submission: { type: Date, required: true },
    evaluation: { type: Date, required: true }
}, { _id: false });

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
        description: { type: String },
        budget: {
            type: Number,
            required: true,
            min: 0,
        },
        usedBudget: {
            type: Number,
            default: 0,
            required: true,
            min: 0,
        },
        deadlines: [CallDeadlineSchema],
        status: { type: String, enum: Object.values(CallStatus), required: true },
    },
    { timestamps: true }
);


export const Call = model<ICall>(COLLECTIONS.CALL, CallSchema);

