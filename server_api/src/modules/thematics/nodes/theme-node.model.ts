import mongoose, { Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export interface IThemeNode extends Document {
  name: string;
  isRoot?: boolean;
  parent?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ThemeNodeSchema = new Schema<IThemeNode>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    isRoot: {
      type: Boolean,
      default: false,
      immutable: true
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.THEME_NODE,
      default: null,
      immutable: true,
      unique: true
    },

  },
  {
    timestamps: true
  }
);

export const ThemeNode = mongoose.model<IThemeNode>(COLLECTIONS.THEME_NODE, ThemeNodeSchema);