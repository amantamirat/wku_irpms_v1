import { Document, Schema, model } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export interface PositionDocument extends Document {
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const PositionSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export const Position = model<PositionDocument>(COLLECTIONS.POSITION, PositionSchema);

