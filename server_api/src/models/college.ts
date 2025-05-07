import { Schema, model, Document } from 'mongoose';

export interface ICollege extends Document {
  college_name: string;
  number_of_departments: number;
}

const CollegeSchema = new Schema<ICollege>({
  college_name: {
    type: String,
    required: true,
    index: { unique: true }
  },
  number_of_departments: {
    type: Number,
    default: 0
  }
});

const College = model<ICollege>('College', CollegeSchema);

export default College;
