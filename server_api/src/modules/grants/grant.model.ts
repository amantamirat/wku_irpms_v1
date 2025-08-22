import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";

interface IGrant extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    theme: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const GrantSchema = new Schema<IGrant>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.ORGANIZATION,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    theme: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.THEME,
        required: true
    },
    evaluation: {
        type: Schema.Types.ObjectId,
        ref: COLLECTIONS.EVAL,
        required: true
    },
}, { timestamps: true });


export const Grant = model<IGrant>(COLLECTIONS.GRANT, GrantSchema);