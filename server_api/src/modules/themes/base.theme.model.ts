import { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { ThemeType } from "./enums/theme.type.enum";

export interface BaseThemeDocument extends Document {
    type: ThemeType;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const BaseThemeSchema = new Schema<BaseThemeDocument>(
    {
        type: { type: String, enum: Object.values(ThemeType), required: true },
        title: { type: String, required: true }
    },
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);


BaseThemeSchema.index(
  { parent: 1, priority: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: { $in: [ThemeType.theme, ThemeType.componenet, ThemeType.focusArea] },
      priority: { $exists: true },
      parent: { $exists: true}
    }
  }
);

BaseThemeSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const themeId = this._id;
    const hasChildren = await Theme.exists({ parent: themeId });
    if (hasChildren) {
        const err = new Error(`Cannot delete: ${this.title} ${this.type}, it is a parent of other themes.`);
        return next(err);
    }
    next();
});

// Base model
export const Theme = model<BaseThemeDocument>(COLLECTIONS.THEME, BaseThemeSchema);
Theme.createIndexes();