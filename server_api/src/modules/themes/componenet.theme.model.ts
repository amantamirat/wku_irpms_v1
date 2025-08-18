import { Schema, Types } from "mongoose";
import { ThemeType} from "./enums/theme.type.enum";
import { COLLECTIONS } from "../../enums/collections.enum";
import { BaseThemeDocument, Theme } from "./base.theme.model";


export interface ComponenetDocument extends BaseThemeDocument {
    type: ThemeType.componenet;
    priority?: number;
    parent: Types.ObjectId;
}

const ComponenetSchema = new Schema<ComponenetDocument>({
    priority: { type: Number },
    parent: { type: Schema.Types.ObjectId, ref: COLLECTIONS.THEME, required: true },
});


export const Componenet = Theme.discriminator<ComponenetDocument>(ThemeType.componenet, ComponenetSchema);
