// common/schemas/status-history.schema.ts
import { Schema } from "mongoose";
import { COLLECTIONS } from "../constants/collections.enum";

export const createStatusHistorySchema = <T extends string>(
    statuses: readonly T[]
) =>
    new Schema(
        {
            status: {
                type: String,
                enum: statuses,
                required: true
            },

            changedBy: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.USER,
                required: true
            },

            changedAt: {
                type: Date,
                required: true,
                default: Date.now
            }
        },
        { _id: false }
    );