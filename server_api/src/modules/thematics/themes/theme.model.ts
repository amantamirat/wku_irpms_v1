import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export interface ITheme extends Document {
  _id: mongoose.Types.ObjectId;
  thematicArea: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  title: string;
  priority?: number;
  level: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ThemeSchema = new Schema<ITheme>(
  {
    thematicArea: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.THEMATIC,
      required: true
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.THEME,
    },
    title: { type: String, required: true },
    priority: { type: Number },
    level: { type: Number, required: true, default: 0, min: 0, max: 4, immutable: true },
  },
  { timestamps: true }
);

export const Theme = model<ITheme>(COLLECTIONS.THEME, ThemeSchema);
