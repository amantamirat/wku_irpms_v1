import mongoose, { Schema, model, Document } from 'mongoose';
import { CallStatus } from './enums/call.status.enum';
import { COLLECTIONS } from '../../enums/collections.enum';

export interface ICall extends Document {
    directorate: mongoose.Types.ObjectId;
    calendar: mongoose.Types.ObjectId;
    title: string;
    deadline: Date;
    description?: string;
    total_budget?: number;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallSchema = new Schema<ICall>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        required: true
    },
    calendar: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALENDAR,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    description: {
        type: String,
    },
    total_budget: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(CallStatus),
        default: CallStatus.planned,
        required: true
    }
}, { timestamps: true });


export const Call = model<ICall>(COLLECTIONS.CALL, CallSchema);
