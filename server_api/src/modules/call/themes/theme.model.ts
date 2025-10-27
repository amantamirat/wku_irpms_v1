import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../util/collections.enum";
import { ThemeType, ThemeLevel } from "./theme.enum";
import { Directorate } from "../../organization/organization.model";

export interface BaseThemeDocument extends Document {
  type: ThemeType;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BaseThemeSchema = new Schema<BaseThemeDocument>(
  {
    type: { type: String, enum: Object.values(ThemeType), required: true, immutable: true },
    title: { type: String, required: true }
  },
  { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

// Base model
export const BaseTheme = model<BaseThemeDocument>(COLLECTIONS.THEME, BaseThemeSchema);

export interface ThematicAreaDocument extends BaseThemeDocument {
  type: ThemeType.thematic_area;
  level: ThemeLevel;
  directorate: mongoose.Types.ObjectId;
}

const ThematicAreaSchema = new Schema<ThematicAreaDocument>({
  directorate: {
    type: Schema.Types.ObjectId,
    ref: Directorate.modelName,
    required: true,
    immutable: true
  },
  level: {
    type: String,
    enum: Object.values(ThemeLevel),
    required: true,
    immutable: true
  }  
});

export const ThematicArea = BaseTheme.discriminator<ThematicAreaDocument>(ThemeType.thematic_area, ThematicAreaSchema);

interface ChildThemeDocument extends BaseThemeDocument {
  catalog: mongoose.Types.ObjectId;
  priority?: number;
  parent: mongoose.Types.ObjectId;
}

const childThemeFields = {
  catalog: {
    type: Schema.Types.ObjectId,
    ref: ThematicArea.modelName,
    required: true
  },
  priority: { type: Number }
};

interface ThemeDocument extends ChildThemeDocument {
  type: ThemeType.theme;
}

const ThemeSchema = new Schema<ThemeDocument>({
  ...childThemeFields,
  parent: {
    type: Schema.Types.ObjectId,
    ref: ThematicArea.modelName,
    required: true
  }
});

export const Theme = BaseTheme.discriminator<ThemeDocument>(ThemeType.theme, ThemeSchema);

interface ComponentDocument extends ChildThemeDocument {
  type: ThemeType.componenet;
}

const ComponenetSchema = new Schema<ComponentDocument>({
  ...childThemeFields,
  parent: {
    type: Schema.Types.ObjectId,
    ref: Theme.modelName,
    required: true
  }
});

export const Componenet = BaseTheme.discriminator<ComponentDocument>(ThemeType.componenet, ComponenetSchema);

interface FocusAreaDocument extends ChildThemeDocument {
  type: ThemeType.focusArea;
}

const FocusAreaSchema = new Schema<FocusAreaDocument>({
  ...childThemeFields,
  parent: {
    type: Schema.Types.ObjectId,
    ref: Componenet.modelName,
    required: true
  }
});

export const FocusArea = BaseTheme.discriminator<FocusAreaDocument>(ThemeType.focusArea, FocusAreaSchema);

//BaseTheme.createIndexes();

