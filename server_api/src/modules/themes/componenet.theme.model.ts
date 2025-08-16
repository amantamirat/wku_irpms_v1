import { Schema, Types } from "mongoose";
import { ThemeType } from "./enums/theme.type.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";
import { COLLECTIONS } from "../../enums/collections.enum";

export interface ComponenetDocument extends BaseThemeDocument {
    type: ThemeType.componenet;
    priority?: number;
    parent: Types.ObjectId;
}

const ComponenetSchema = new Schema<ComponenetDocument>({
    priority: { type: Number },
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
});

ComponenetSchema.pre("save", async function (next) {
    const subTheme = this as any;
    const theme = await Theme.findById(subTheme.parent);
    if (!theme || theme.type !== ThemeType.theme) {
        return next(new Error("Invalid reference: For Componenet parent must be a Broad Theme"));
    }
    next();
});

export const Componenet = Theme.discriminator<ComponenetDocument>(ThemeType.componenet, ComponenetSchema);
