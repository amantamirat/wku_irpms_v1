import mongoose, { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { Directorate } from "../organization/organization.model";
import { ThemeType, ThemeLevel } from "./thematic.enum";

export interface IThematic extends Document {
    directorate: mongoose.Types.ObjectId;
    title: string;
    type: ThemeType;
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
    type: {
        type: String,
        enum: Object.values(ThemeType),
        required: true,
        immutable: true
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