import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { Accessibility, Gender } from "../../users/user.model";
import { AcademicLevel } from "../../../common/constants/enums";

export enum OperationMode {
  COUNT = "COUNT",
  RATIO = "RATIO"
}
export enum TargetScope {
  PI_ONLY = "PI_ONLY",
  CO_ONLY = "CO_ONLY",
  ALL_MEMBERS = "ALL_MEMBERS",
  TEAM_AGGREGATE = "TEAM_AGGREGATE"
}


export interface IRange {
  min: number;
  max: number;
}
export const RangeSchema = new Schema<IRange>(
  {
    min: { type: Number, default: 0, required: true },
    max: { type: Number, default: Infinity, required: true },
  },
  { _id: false } // prevents extra _id for subdocument
);


export interface IProfileRule {
  gender?: Gender;
  age?: IRange;
  experienceYears?: IRange;
  accessibility?: Accessibility[];
  academicLevels?: AcademicLevel[];
  //specializations?: mongoose.Types.ObjectId[];
}

const ProfileRuleSchema = new Schema<IProfileRule>(
  {
    gender: { type: String },
    age: RangeSchema,
    experienceYears: RangeSchema,
    accessibility: { type: [String], enum: Object.values(Accessibility), default: [] },
    academicLevels: { type: [String], enum: Object.values(AcademicLevel), default: [] },
    // specializations: [{ type: Schema.Types.ObjectId, ref: COLLECTIONS.SPECIALIZATION }],
  },
  { _id: false }
);

export interface IProjectHistoryRule {
  submission?: IRange; //submitted, accepted, finilization, granted
  rejection?: IRange;
  completion?: IRange;
}

const ProjectHistoryRuleSchema = new Schema<IProjectHistoryRule>(
  {
    submission: RangeSchema,
    rejection: RangeSchema,
    completion: RangeSchema,
  },
  { _id: false }
);

export interface IComposition extends Document {
  grant: mongoose.Types.ObjectId;
  description?: string;
  // Scope: Who exactly needs to satisfy this specific rule block?
  targetScope: TargetScope;

  profileRule?: IProfileRule;
  projectHistoryRule?: IProjectHistoryRule;
  //required for aggrigation only
  mode?: OperationMode;
  threshold?: IRange;
  createdAt?: Date;
  updatedAt?: Date;
}


const CompositionSchema = new Schema<IComposition>(
  {
    grant: {
      type: Schema.Types.ObjectId,
      ref: COLLECTIONS.GRANT,
      required: true,
      immutable: true,
      index: true,
    },
    description: { type: String, required: true },

    targetScope: {
      type: String,
      enum: Object.values(TargetScope),
      required: true,
      immutable: true,
    },

    profileRule: ProfileRuleSchema,
    projectHistoryRule: ProjectHistoryRuleSchema,

    mode: {
      type: String,
      enum: Object.values(OperationMode),
    },

    threshold: RangeSchema,
  },
  { timestamps: true }
);


CompositionSchema.index(
  { grant: 1, targetScope: 1 },
  { unique: true }
);


export const Composition = mongoose.model<IComposition>(
  COLLECTIONS.COMPOSITION,
  CompositionSchema
);



