import mongoose, { Schema } from "mongoose";
import { COLLECTIONS } from "../../../enums/collections.enum";

interface IProjectTheme extends Document {
    project: mongoose.Types.ObjectId;
    theme: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const ProThemeSchema: Schema<IProjectTheme> = new Schema(
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
        timestamps: true,
    }
);
ProThemeSchema.index({ project: 1, theme: 1 }, { unique: true });
export const ProjectTheme = mongoose.model<IProjectTheme>(COLLECTIONS.PROJECT_THEMEM, ProThemeSchema);