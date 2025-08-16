import { Schema, Types } from "mongoose";
import { ThemeType } from "./enums/theme.type.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";
import { COLLECTIONS } from "../../enums/collections.enum";
import { ThemeLevel } from "../theme/theme.model";

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
    let parent = await Theme.findById(subTheme.parent).lean() as any;
    if (!parent || parent.type !== ThemeType.theme) {
        return next(new Error("Invalid reference: For Componenet parent must be a Broad Theme"));
    }
    while (parent.parent) {
        parent = await Theme.findById(parent.parent).lean();
    }
    if (!parent || parent.type !== ThemeType.catalog) {
        return next(new Error("Invalid hierarchy: Can Not Found Catalog."));
    }
    if (parent.level === ThemeLevel.broad) {
        return next(new Error("Invalid hierarchy: Component must not trace back to Broad catalog"));
    }
    next();
});

export const Componenet = Theme.discriminator<ComponenetDocument>(ThemeType.componenet, ComponenetSchema);
