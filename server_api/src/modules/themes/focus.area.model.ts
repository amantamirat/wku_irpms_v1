import { Schema, Types } from "mongoose";
import { BaseThemeDocument, Theme } from "./base.model";
import { ThemeType } from "./enums/themeType.enum";
import { COLLECTIONS } from "../../enums/collections.enum";

export interface FocusAreaDocument extends BaseThemeDocument {
    type: ThemeType.focusArea;
    priority?: number;
    parent: Types.ObjectId;
}

const FocusAreaSchema = new Schema<FocusAreaDocument>({
    priority: { type: Number },
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
});

FocusAreaSchema.pre("save", async function (next) {
    const focusArea = this as any;
    const theme = await Theme.findById(focusArea.parent);
    if (!theme || theme.type !== ThemeType.subTheme) {
        return next(new Error("Invalid reference: For Focus Area parent must be a Sub-Theme"));
    }
    next();
});

export const FocusArea = Theme.discriminator<FocusAreaDocument>(ThemeType.focusArea, FocusAreaSchema);