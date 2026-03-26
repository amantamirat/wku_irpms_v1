import { model, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { ThemeLevel } from "./thematic.enum";
import { ThematicStatus } from "./thematic.state-machine";

export interface IThematic extends Document {
    _id?: string;
    title: string;
    level: ThemeLevel;
    description?: string;
    status: ThematicStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const ThematicSchema = new Schema<IThematic>({
    title: {
        type: String,
        unique: true,
        required: true
    },
    level: {
        type: String,
        enum: Object.values(ThemeLevel),
        required: true,
        immutable: true
    },
    description: {
        type: String,
    },
    status: {
        type: String,
        enum: Object.values(ThematicStatus),
        default: ThematicStatus.draft,
        required: true
    },
}, { timestamps: true });

export const Thematic = model<IThematic>(COLLECTIONS.THEMATIC, ThematicSchema);