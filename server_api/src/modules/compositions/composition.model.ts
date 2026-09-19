import mongoose, { Document, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { HistoryContext, IHistoryRuleReference } from "./history/history.model";

export interface IComposition extends Document {

  name: string;
  description?: string;

  leadProfileRule?: mongoose.Types.ObjectId;

  leadHistoryRules?: IHistoryRuleReference[];

  memberRequirements?: mongoose.Types.ObjectId[];

  createdAt?: Date;
  updatedAt?: Date;
}



const TeamCompositionSchema = new Schema<IComposition>(
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
    leadProfileRule: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.ELIGIBILITY_PROFILE
    },
    leadHistoryRules: {
      type: [
        {
          context: {
            type: String,
            enum: Object.values(HistoryContext),
            required: true
          },
          rule: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.HISTORY_RULE,
            required: true
          }
        }
      ],
      default: []
    },
    memberRequirements: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: COLLECTIONS.MEMBER_REQUIREMENT
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  });



export const Composition =
  mongoose.model<IComposition>(
    COLLECTIONS.COMPOSITION,
    TeamCompositionSchema
  );
