import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export interface ITheme extends Document {
  title: string;
  priority?: number;
  parent?: mongoose.Types.ObjectId;
  thematicArea: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ThemeSchema = new Schema<ITheme>(
  {
    title: { type: String, required: true },
    priority: { type: Number },    
    parent: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.THEME,
    },    
    thematicArea: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.THEMATIC,
      required: true
    },
  },
  { timestamps: true } // discriminatorKey
);

export const Theme = model<ITheme>(COLLECTIONS.THEME, ThemeSchema);











