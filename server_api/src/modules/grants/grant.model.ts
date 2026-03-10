import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { Directorate } from "../organization/organization.model";

export enum FundingSource {
    INTERNAL = "internal",
    EXTERNAL = "external",
}

export enum GrantStatus {
    planned = 'planned',
    active = 'active',
    closed = "closed"
}

export interface IGrant extends Document {
    fundingSource: FundingSource;
    organization: mongoose.Types.ObjectId; //Funder Organization
    title: string;
    amount: number;
    thematic?: mongoose.Types.ObjectId;
    description?: string;
    status: GrantStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const GrantSchema = new Schema<IGrant>({
    fundingSource: {
        type: String,
        enum: Object.values(FundingSource),
        required: true,
        immutable: true
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: Directorate.modelName,
        required: true,
        immutable: true
    },
    title: {
        type: String,
        required: true
    },
    amount:
    {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    thematic: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.THEMATIC
    },
    description: {
        type: String,
    },
    status: {
        type: String, enum: Object.values(GrantStatus),
        default: GrantStatus.planned, required: true
    }
}, { timestamps: true });

export const Grant = model<IGrant>(COLLECTIONS.GRANT, GrantSchema);