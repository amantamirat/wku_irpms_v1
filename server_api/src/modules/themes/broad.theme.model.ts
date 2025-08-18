import { Schema, Types } from "mongoose";
import { ThemeType } from "./enums/theme.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";


export interface BroadThemeDocument extends BaseThemeDocument {
  type: ThemeType.theme;
  priority?: number;
  parent: Types.ObjectId;
}

const BroadThemeSchema = new Schema<BroadThemeDocument>({
  priority: { type: Number },
  parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
});

BroadThemeSchema.index({ parent: 1, priority: 1 },
  {
    unique: true,
    partialFilterExpression: {
      priority: { $exists: true }
    }
  }
);

// Create discriminators
export const BroadTheme = Theme.discriminator<BroadThemeDocument>(ThemeType.theme, BroadThemeSchema);

