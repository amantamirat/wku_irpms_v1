import mongoose, { Schema, model, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum AllocationStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export interface IGrantAllocation extends Document {
    _id: string;
    grant: mongoose.Types.ObjectId;
    calendar: mongoose.Types.ObjectId;
    allocatedAmount: number;   // allocated budget from this grant for this calendar    
    // optional but VERY useful for performance
    usedBudget: number;   // cached used amount (updated via logic)
    status: AllocationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const GrantAllocationSchema = new Schema<IGrantAllocation>({
    grant: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.GRANT,
        required: true,
        immutable: true,
    },
    calendar: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.CALENDAR,
        required: true,
        immutable: true,
    },
    allocatedAmount: {
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
    status: {
        type: String, enum: Object.values(AllocationStatus),
        default: AllocationStatus.planned, required: true
    }
}, { timestamps: true });


// 🔥 One allocation per grant per calendar
GrantAllocationSchema.index({ grant: 1, calendar: 1 }, { unique: true });

export const GrantAllocation = model<IGrantAllocation>(
    COLLECTIONS.GRANT_ALLOCATION,
    GrantAllocationSchema
);

