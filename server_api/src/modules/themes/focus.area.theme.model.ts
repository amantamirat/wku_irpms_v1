import { Schema, Types } from "mongoose";
import { BaseThemeDocument, Theme } from "./base.theme.model";
import { ThemeType } from "./enums/theme.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { ThemeLevel } from "./enums/theme.level.enum";

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
    let parent = await Theme.findById(focusArea.parent).lean() as any;
    if (!parent || parent.type !== ThemeType.componenet) {
        return next(new Error("Invalid reference: For Focus Area parent must be a Component"));
    }
    while (parent.parent) {
        parent = await Theme.findById(parent.parent).lean();
    }
    if (!parent || parent.type !== ThemeType.catalog) {
        return next(new Error("Invalid hierarchy: Can Not Found Catalog."));
    }
    if (parent.level === ThemeLevel.broad || parent.level === ThemeLevel.componenet) {
        return next(new Error("Invalid hierarchy: Focus Area must not trace back to Broad or Component catalog"));
    }
    next();
});

export const FocusArea = Theme.discriminator<FocusAreaDocument>(ThemeType.focusArea, FocusAreaSchema);