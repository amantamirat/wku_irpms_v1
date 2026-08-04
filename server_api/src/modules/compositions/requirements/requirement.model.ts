import mongoose, { Schema } from "mongoose";
import { IRange, RangeSchema } from "../composition.model";
import { COLLECTIONS } from "../../../common/constants/collections.enum";

export enum AggregationMode {
    COUNT = "COUNT",
    RATIO = "RATIO"
}

export interface IMemberRequirement extends Document {
    name: string;
    description?: string;
    profile?: mongoose.Types.ObjectId;
    historyRule?: mongoose.Types.ObjectId;
    mode: AggregationMode;
    threshold: IRange;
    createdAt?: Date;
    updatedAt?: Date;
}


const MemberRequirementSchema =
    new Schema<IMemberRequirement>(
        {

            name: {
                type: String,
                required: true,
                trim: true,
                unique: true
            },
            description: {
                type: String,
                trim: true
            },
            profile: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.ELIGIBILITY_PROFILE
            },
            historyRule: {
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.HISTORY_RULE
            },
            mode: {
                type: String,
                enum: Object.values(AggregationMode),
                required: true
            },
            threshold: {
                type: RangeSchema,
                required: true
            }

        },
        {
            timestamps: true
        });

export const MemberRequirement =
    mongoose.model<IMemberRequirement>(
        COLLECTIONS.MEMBER_REQUIREMENT,
        MemberRequirementSchema
    );