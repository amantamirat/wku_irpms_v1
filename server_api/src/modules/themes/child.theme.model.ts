import { Schema, Types } from "mongoose";
import { ThemeType } from "./enums/theme.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";


interface BaseChildTheme extends BaseThemeDocument {
  catalog: Types.ObjectId;
  priority?: number;
  parent: Types.ObjectId;
}

interface ThemeDocument extends BaseChildTheme {
  type: ThemeType.theme;
}

interface ComponentDocument extends BaseChildTheme {
  type: ThemeType.componenet;
}

interface FocusAreaDocument extends BaseChildTheme {
  type: ThemeType.focusArea;
}

const ChildThemeSchema = new Schema<BaseChildTheme>({
  priority: { type: Number },
  parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
  catalog: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
});



// Create discriminators
export const BroadTheme = Theme.discriminator<ThemeDocument>(ThemeType.theme, ChildThemeSchema);

export const Componenet = Theme.discriminator<ComponentDocument>(ThemeType.componenet, ChildThemeSchema);

export const FocusArea = Theme.discriminator<FocusAreaDocument>(ThemeType.focusArea, ChildThemeSchema);
