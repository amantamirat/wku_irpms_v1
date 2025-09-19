import mongoose, { Schema } from "mongoose";
import { COLLECTIONS } from "../../../enums/collections.enum";

interface IProTheme extends Document {
    project: mongoose.Types.ObjectId;
    theme: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProThemeSchema: Schema<IProTheme> = new Schema(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.PROJECT,
            required: true,
        },
        theme: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.THEME,
            required: true,
        },
    },
    {
        timestamps: true, // automatically adds createdAt & updatedAt
    }
);

export const ProTheme = mongoose.model<IProTheme>(COLLECTIONS.PROJECT_THEMEM, ProThemeSchema);