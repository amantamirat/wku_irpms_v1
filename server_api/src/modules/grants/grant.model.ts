import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { Directorate } from "../organization/organization.model";

export enum FundingSource {
    INTERNAL = "internal",
    EXTERNAL = "external",
}

export interface IGrant extends Document {
    fundingSource: FundingSource;
    organization: mongoose.Types.ObjectId; //Funder Organization
    title: string;
    amount: number;
    description?: string;
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
    description: {
        type: String,
    },
    amount:
    {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
}, { timestamps: true });

export const Grant = model<IGrant>(COLLECTIONS.GRANT, GrantSchema);