import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../util/collections.enum";
import { Directorate } from "../organization/organization.model";
import { ThemeLevel } from "../themes/theme.enum";

export interface IThematic extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    level: ThemeLevel;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ThematicSchema = new Schema<IThematic>({
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
    level: {
        type: String,
        enum: Object.values(ThemeLevel),
        required: true,
        immutable: true
    },
    description: {
        type: String,
    }
}, { timestamps: true });

export const Thematic = model<IThematic>(COLLECTIONS.THEMATIC, ThematicSchema);