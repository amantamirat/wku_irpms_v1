import mongoose, { Schema, model, Document } from 'mongoose';

export enum CallStatus {
    Planned = 'Planned',
    Active = 'Active',
    Closed = 'Closed',
    Locked = 'Locked'
}

export interface ICall extends Document {
    directorate: mongoose.Types.ObjectId;
    calendar: mongoose.Types.ObjectId;
    title: string;
    dead_line: Date;
    description?: string;
    notes?: string[];
    max_total_allocated_budget?: number;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const CallSchema = new Schema<ICall>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: 'Directorate',
        required: true
    },
    calendar: {
        type: Schema.Types.ObjectId,
        ref: 'Calendar',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    dead_line: {
        type: Date,
        required: true
    },
    description: {
        type: String,
    },
    notes: {
        type: [String],
    },
    max_total_allocated_budget: {
        type: Number,
    },
    status: {
        type: String,
        enum: Object.values(CallStatus),
        default: CallStatus.Planned,
        required: true
    }
}, { timestamps: true });


const Call = model<ICall>('Call', CallSchema);
export default Call;
