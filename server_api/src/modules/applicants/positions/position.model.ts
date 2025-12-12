import mongoose, { Schema, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
//import { Scope } from "../applicant.enum";
import { PositionType } from "./position.enum";
import { applicantUnits } from "../../applicants/applicant.enum";

interface BasePositionDocument extends Document {
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
    { timestamps: true, discriminatorKey: "type" } // discriminatorKey
);

export const BasePosition = model<BasePositionDocument>(COLLECTIONS.POSITION, BasePositionSchema);

interface PositionDocument extends BasePositionDocument {
    type: PositionType.position
    category: (typeof applicantUnits)[number];
}

const PositionSchema = new Schema<PositionDocument>(
    {
        category: { type: String, enum: applicantUnits, required: true },
    }
);

export const Position = BasePosition.discriminator<PositionDocument>(PositionType.position, PositionSchema);

interface RankDocument extends BasePositionDocument {
    type: PositionType.rank;
    parent: mongoose.Types.ObjectId;
}

const RankSchema = new Schema<RankDocument>({
    parent: {
        type: Schema.Types.ObjectId,
        ref: Position.modelName,
        required: true,
    }
});

export const Rank = BasePosition.discriminator<RankDocument>(PositionType.rank, RankSchema);
