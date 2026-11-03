import mongoose, { Schema } from "mongoose";

import { COLLECTIONS } from "../../../common/constants/collections.enum";


export interface IMemberRequirement extends Document {
    name: string;
    description?: string;
    profile?: mongoose.Types.ObjectId;
    historyRules: mongoose.Types.ObjectId[];
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
            historyRules: [{
                type: Schema.Types.ObjectId,
                ref: COLLECTIONS.HISTORY_RULE,
                required: true,
                default:[]
            }],          

        },
        {
            timestamps: true
        });

export const MemberRequirement =
    mongoose.model<IMemberRequirement>(
        COLLECTIONS.REQUIREMENT,
        MemberRequirementSchema
    );