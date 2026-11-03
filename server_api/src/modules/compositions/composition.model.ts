import mongoose, { Document, Schema } from "mongoose";
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { RangeSchema } from "../../common/schemas/range.schema";
import { IRange } from "../../common/types/range";

export enum AggregationMode {
  COUNT = "COUNT",
  RATIO = "RATIO",
}

export interface IMemberRule {
  requirement: mongoose.Types.ObjectId;
  mode: AggregationMode;
  threshold: IRange;
}

export interface IComposition extends Document {
  name: string;
  description?: string;

  leadRule?: mongoose.Types.ObjectId;
  memberRules: IMemberRule[];

  createdAt?: Date;
  updatedAt?: Date;
}

const MemberRuleSchema = new Schema<IMemberRule>(
  {
    requirement: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.REQUIREMENT,
      required: true,
    },
    mode: {
      type: String,
      enum: Object.values(AggregationMode),
      required: true,
    },
    threshold: {
      type: RangeSchema,
      required: true,
    },
  },
  { _id: false }
);

const TeamCompositionSchema = new Schema<IComposition>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    leadRule: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.REQUIREMENT,
    },
    memberRules: {
      type: [MemberRuleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Composition = mongoose.model<IComposition>(
  COLLECTIONS.COMPOSITION,
  TeamCompositionSchema
);