import { Schema, Types } from "mongoose";
import { COLLECTIONS } from "../../enums/collections.enum";
import { ThemeLevel } from "./enums/theme.level.enum";
import { ThemeType } from "./enums/theme.type.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";

export interface CatalogDocument extends BaseThemeDocument {
    type: ThemeType.catalog;
    level: ThemeLevel;
    directorate: Types.ObjectId;
}

const CatalogSchema = new Schema<CatalogDocument>({
    level: { type: String, enum: Object.values(ThemeLevel), required: true, immutable:true },
    directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGANIZATION, required: true, immutable: true },
});

CatalogSchema.index(
    { title: 1, directorate: 1 },
    {
        unique: true,
        partialFilterExpression: { type: ThemeType.catalog }
    }
);

export const Catalog = Theme.discriminator<CatalogDocument>(ThemeType.catalog, CatalogSchema);
Catalog.createIndexes();