import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../util/collections.enum";
import { Directorate } from "../organization/organization.model";

interface IGrant extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const GrantSchema = new Schema<IGrant>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: Directorate.modelName,
        required: true,
        immutable:true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    }
}, { timestamps: true });

export const Grant = model<IGrant>(COLLECTIONS.GRANT, GrantSchema);