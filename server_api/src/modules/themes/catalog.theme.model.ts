import { Schema, Types } from "mongoose";
import { BaseThemeDocument, Theme } from "./base.theme.model";
import { ThemeLevel } from "./enums/theme.level.enum";
import { ThemeType } from "./enums/theme.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { Unit } from "../organizations/enums/unit.enum";
import Organization from "../organizations/organization.model";

export interface CatalogDocument extends BaseThemeDocument {
    type: ThemeType.catalog;
    level: ThemeLevel;
    directorate: Types.ObjectId;
}

const CatalogSchema = new Schema<CatalogDocument>({
    level: { type: String, enum: Object.values(ThemeLevel), required: true },
    directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGANIZATION, required: true, immutable: true },
});

CatalogSchema.index(
    { title: 1, directorate: 1 },
    {
        unique: true,
        partialFilterExpression: { type: ThemeType.catalog }
    }
);

CatalogSchema.pre("save", async function (next) {
    const catalog = this as any;
    const directorate = await Organization.findById(catalog.directorate);
    if (!directorate || directorate.type !== Unit.Directorate) {
        return next(new Error("Invalid reference: must be a Directorate"));
    }
    next();
});

export const Catalog = Theme.discriminator<CatalogDocument>(ThemeType.catalog, CatalogSchema);
Catalog.createIndexes();