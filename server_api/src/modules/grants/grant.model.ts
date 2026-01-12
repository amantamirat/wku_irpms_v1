import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { Directorate } from "../organization/organization.model";

export interface IGrant extends Document {
    directorate: mongoose.Types.ObjectId; //Funder Organization
    title: string;
    fundingSource?: string;//Internal or External if External Organization reference required
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const GrantSchema = new Schema<IGrant>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: Directorate.modelName,
        required: true,
        immutable: true
    },
    title: {
        type: String,
        required: true
    },
    fundingSource: {
        type: String,
    },
    description: {
        type: String,
    }
}, { timestamps: true });

export const Grant = model<IGrant>(COLLECTIONS.GRANT, GrantSchema);