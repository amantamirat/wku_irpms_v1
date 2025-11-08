import mongoose, { Document, Schema, model } from "mongoose";
import { COLLECTIONS } from "../../util/collections.enum";
import { CycleStatus, CycleType } from "./cycle.d";

const CYCLE_STATUSES: CycleStatus[] = ["planned", "active", "closed", "archived"];
const CYCLE_TYPES: CycleType[] = ["Call", "Program"];

interface ICycle extends Document {
    calendar: mongoose.Types.ObjectId;
    grant: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    theme?: mongoose.Types.ObjectId;
    status: CycleStatus;
    type: CycleType;
    organization: mongoose.Types.ObjectId; // unified field directorate or center
    createdAt?: Date;
    updatedAt?: Date;
}

const CycleSchema = new Schema<ICycle>(
    {
        calendar: { type: Schema.Types.ObjectId, ref: COLLECTIONS.CALENDAR, required: true },
        grant: { type: Schema.Types.ObjectId, ref: COLLECTIONS.GRANT, required: true },
        title: { type: String, required: true },
        description: { type: String },
        theme: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME },
        status: { type: String, enum: CYCLE_STATUSES, required: true },
        type: { type: String, enum: CYCLE_TYPES, required: true },
        organization: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGANIZATION, required: true },
    },
    { timestamps: true }
);

export const Cycle = model<ICycle>(COLLECTIONS.CYCLE, CycleSchema);
