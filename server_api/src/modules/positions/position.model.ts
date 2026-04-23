import mongoose, { Schema, model, Document } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export enum PositionType {
    position = 'position',
    rank = 'rank'
}
/* =========================
   Base Model
========================= */

export interface BasePositionDocument extends Document {
    type: PositionType;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const BasePositionSchema = new Schema<BasePositionDocument>(
    {
        type: {
            type: String,
            enum: Object.values(PositionType),
            required: true,
            immutable: true
        },
        name: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
        discriminatorKey: "type"
    }
);

export const BasePosition = model<BasePositionDocument>(
    COLLECTIONS.POSITION,
    BasePositionSchema
);

/* =========================
   Position Model
========================= */

interface PositionDocument extends BasePositionDocument {
    type: PositionType.position;
}

export const Position = BasePosition.discriminator<PositionDocument>(
    PositionType.position,
    new Schema({})
);

/* =========================
   Rank Model
========================= */

interface RankDocument extends BasePositionDocument {
    type: PositionType.rank;
    parent: mongoose.Types.ObjectId;
}

const RankSchema = new Schema<RankDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: BasePosition.modelName,
        required: true
    }
});

export const Rank = BasePosition.discriminator<RankDocument>(
    PositionType.rank,
    RankSchema
);

