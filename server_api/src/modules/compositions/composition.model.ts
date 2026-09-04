import mongoose, { Document, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";

export interface IComposition extends Document {
  name: string;
  description?: string;
  leadProfileRule?: mongoose.Types.ObjectId;//profile
  leadHistoryRule?: mongoose.Types.ObjectId;//history
  memberRequirements?: mongoose.Types.ObjectId[];//requirement
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
    leadHistoryRule: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.HISTORY_RULE
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
