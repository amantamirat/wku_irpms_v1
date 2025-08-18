import { Schema, Types } from "mongoose";
import { ThemeType } from "./enums/theme.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";

export interface FocusAreaDocument extends BaseThemeDocument {
    type: ThemeType.focusArea;
    priority?: number;
    parent: Types.ObjectId;
}

const FocusAreaSchema = new Schema<FocusAreaDocument>({
    priority: { type: Number },
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
});

export const FocusArea = Theme.discriminator<FocusAreaDocument>(ThemeType.focusArea, FocusAreaSchema);