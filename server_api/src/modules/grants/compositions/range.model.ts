import { Schema } from "mongoose";

export interface IRange {
  min: number;
  max: number;
}

export const RangeSchema = new Schema<IRange>(
  {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  { _id: false } // prevents extra _id for subdocument
);
