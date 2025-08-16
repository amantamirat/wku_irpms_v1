import { Schema, Types } from "mongoose";
import { ThemeType } from "./enums/theme.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";

export interface BroadThemeDocument extends BaseThemeDocument {
    type: ThemeType.broadTheme;
    priority?: number;
    parent: Types.ObjectId;
}

const BroadThemeSchema = new Schema<BroadThemeDocument>({
    priority: { type: Number },
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
});

BroadThemeSchema.pre("save", async function (next) {
    const broadTheme = this as any;
    const theme = await Theme.findById(broadTheme.parent);
    if (!theme || theme.type !== ThemeType.catalog) {
        return next(new Error("Invalid reference: For Broad-Theme parent must be a Catalog"));
    }
    next();
});

// Create discriminators
export const BroadTheme = Theme.discriminator<BroadThemeDocument>(ThemeType.broadTheme, BroadThemeSchema);

