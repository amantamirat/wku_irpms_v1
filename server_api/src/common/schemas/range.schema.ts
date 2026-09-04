import { Schema } from "mongoose";
import { IRange } from "../types/range";

export const RangeSchema = new Schema<IRange>(
  {
    min: { type: Number, default: 0 },
    max: { type: Number, default: Infinity },
  },
  { _id: false } // prevents extra _id for subdocument
);