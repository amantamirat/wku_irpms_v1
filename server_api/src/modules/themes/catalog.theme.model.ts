import { Schema, Types } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { ThemeLevel } from "./enums/theme.level.enum";
import { ThemeType } from "./enums/theme.type.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";
import { Grant } from "../grants/grant.model";

export interface CatalogDocument extends BaseThemeDocument {
    type: ThemeType.catalog;
    level: ThemeLevel;
    directorate: Types.ObjectId;
}

const CatalogSchema = new Schema<CatalogDocument>({
    level: { type: String, enum: Object.values(ThemeLevel), required: true, immutable:true },
    directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGAN, required: true, immutable: true },
});

CatalogSchema.index(
    { title: 1, directorate: 1 },
    {
        unique: true,
        partialFilterExpression: { type: ThemeType.catalog }
    }
);

CatalogSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const themeId = this._id;
  const isReferencedByGrant = await Grant.exists({ theme: themeId });
  if (isReferencedByGrant) {
    const err = new Error(`Cannot delete: ${this.title} it is referenced in Grant.`);
    return next(err);
  }
  next();
});

export const Catalog = Theme.discriminator<CatalogDocument>(ThemeType.catalog, CatalogSchema);
Catalog.createIndexes();