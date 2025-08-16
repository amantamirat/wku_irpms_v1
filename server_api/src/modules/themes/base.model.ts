import { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { ThemeType } from "./enums/themeType.enum";

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
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey is required
);

// Base model
export const Theme = model<BaseThemeDocument>(COLLECTIONS.THEME, BaseThemeSchema);