import mongoose, { Schema, Document } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { Accessibility, Gender } from "../../applicants/applicant.enum";
import { AcademicLevel } from "../../../common/constants/enums";
import { PublicationType } from "../../applicants/publications/publication.model";
import { IRange, RangeSchema } from "./range.model";

export enum OperationMode {
    COUNT = "COUNT",
    RATIO = "RATIO"
}

export interface IComposition extends Document {
  grant: mongoose.Types.ObjectId;
  title: string;

  gender?: Gender;

  age?: IRange;                // minAge & maxAge
  experienceYears?: IRange;    // minExperienceYears (could extend with min/max if needed)

  accessibility?: Accessibility[];

  maxSubmission?: number;
  minCompletion?: number;

  academicLevels?: AcademicLevel[];
  specializations?: mongoose.Types.ObjectId[];

  positions?: mongoose.Types.ObjectId[];

  publicationTypes?: PublicationType[];
  programTypes?: AcademicLevel[];

  isPI?: boolean;

  minCount: number;
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
    title: { type: String, required: true },

    gender: { type: String, enum: Object.values(Gender) },

    age: { type: RangeSchema },              // min/max age
    experienceYears: { type: RangeSchema },  // min/max experience

    accessibility: { type: [String], enum: Object.values(Accessibility), default: [] },

    maxSubmission: { type: Number },
    minCompletion: { type: Number },

    academicLevels: { type: [String], enum: Object.values(AcademicLevel), default: [] },
    specializations: [{ type: Schema.Types.ObjectId, ref: COLLECTIONS.SPECIALIZATION }],
    positions: [{ type: Schema.Types.ObjectId, ref: COLLECTIONS.POSITION }],

    publicationTypes: { type: [String], enum: Object.values(PublicationType), default: [] },
    programTypes: { type: [String], enum: Object.values(AcademicLevel), default: [] },

    isPI: { type: Boolean, default: false },

    minCount: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);


CompositionSchema.index(
  { grant: 1, isPI: 1 },
  { unique: true, partialFilterExpression: { isPI: true } }
);


export const Composition = mongoose.model<IComposition>(
  COLLECTIONS.COMPOSITION_NEW,
  CompositionSchema
);
