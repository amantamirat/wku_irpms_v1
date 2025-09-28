import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { ThemeType, ThemeLevel } from "./theme.enum";
import { Directorate } from "../organization/organization.model";

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

export interface CatalogDocument extends BaseThemeDocument {
  type: ThemeType.catalog;
  level: ThemeLevel;
  directorate: mongoose.Types.ObjectId;
}

const CatalogSchema = new Schema<CatalogDocument>({
  level: {
    type: String,
    enum: Object.values(ThemeLevel),
    required: true,
    immutable: true
  },
  directorate: {
    type: Schema.Types.ObjectId,
    ref: Directorate.modelName,
    required: true,
    immutable: true,
    validate: {
      validator: async function (directorateId: mongoose.Types.ObjectId) {
        const exist = await Directorate.exists({ _id: directorateId });
        return !!exist;
      }
    },
  },
});

export const Catalog = BaseTheme.discriminator<CatalogDocument>(ThemeType.catalog, CatalogSchema);

interface ChildThemeDocument extends BaseThemeDocument {
  catalog: mongoose.Types.ObjectId;
  priority?: number;
  parent: mongoose.Types.ObjectId;
}

const childThemeFields = {
  catalog: {
    type: Schema.Types.ObjectId,
    ref: Catalog.modelName,
    required: true,
    validate: {
      validator: async function (catalogId: mongoose.Types.ObjectId) {
        const exist = await Catalog.exists({ _id: catalogId });
        return !!exist;
      }
    },
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
    ref: Catalog.modelName,
    required: true,
    validate: {
      validator: async function (parentId: mongoose.Types.ObjectId) {
        const exist = await Catalog.exists({ _id: parentId });
        return !!exist;
      },
      message: "Theme must belong to a Catalog",
    },
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
    required: true,
    validate: {
      validator: async function (parentId: mongoose.Types.ObjectId) {
        const exist = await Catalog.exists({ _id: parentId });
        return !!exist;
      },
      message: "Componenet must belong to a Theme",
    },
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
    required: true,
    validate: {
      validator: async function (parentId: mongoose.Types.ObjectId) {
        const exist = await Componenet.exists({ _id: parentId });
        return !!exist;
      },
      message: "Focus Area must belong to a Component",
    },
  }
});

export const FocusArea = BaseTheme.discriminator<FocusAreaDocument>(ThemeType.focusArea, FocusAreaSchema);

BaseThemeSchema.index(
  { parent: 1, priority: 1 },
  {
    unique: true,
    partialFilterExpression: {
      priority: { $exists: true },
      parent: { $exists: true }
    }
  }
);

BaseTheme.createIndexes();


/*
BaseThemeSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const themeId = this._id;
  const hasChildren = await BaseTheme.exists({ parent: themeId });
  if (hasChildren) {
    const err = new Error(`Cannot delete: ${this.title} ${this.type}, it is a parent of other themes.`);
    return next(err);
  }
  next();
});
*/

