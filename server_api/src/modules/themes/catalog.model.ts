import { Schema, Types } from "mongoose";
import { BaseThemeDocument, Theme } from "./base.model";
import { ThemeLevel } from "./enums/themeLevel.enum";
import { ThemeType } from "./enums/themeType.enum";
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
    directorate: { type: Schema.Types.ObjectId, ref: COLLECTIONS.ORGANIZATION, required: true },
});

CatalogSchema.pre("save", async function (next) {
    const catalog = this as any;
    const directorate = await Organization.findById(catalog.directorate);
    if (!directorate || directorate.type !== Unit.Directorate) {
        return next(new Error("Invalid reference: must be a Directorate"));
    }
    next();
});

export const Catalog = Theme.discriminator<CatalogDocument>(ThemeType.catalog, CatalogSchema);
