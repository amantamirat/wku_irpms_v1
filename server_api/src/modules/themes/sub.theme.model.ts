import { Schema, Types } from "mongoose";
import { ThemeLevel } from "./enums/theme.level.enum";
import { ThemeType } from "./enums/theme.type.enum";
import { BaseThemeDocument, Theme } from "./base.model";
import { COLLECTIONS } from "../../enums/collections.enum";

export interface SubThemeDocument extends BaseThemeDocument {
    type: ThemeType.subTheme;
    priority?: number;
    parent: Types.ObjectId;
}

const SubThemeSchema = new Schema<SubThemeDocument>({
    priority: { type: Number },
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
});

SubThemeSchema.pre("save", async function (next) {
    const subTheme = this as any;
    const theme = await Theme.findById(subTheme.parent);
    if (!theme || theme.type !== ThemeType.broadTheme) {
        return next(new Error("Invalid reference: For Sub-Theme parent must be a Broad-Theme"));
    }
    next();
});

export const SubTheme = Theme.discriminator<SubThemeDocument>(ThemeType.subTheme, SubThemeSchema);
