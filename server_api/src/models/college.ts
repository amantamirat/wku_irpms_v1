import { Schema, model, Document } from 'mongoose';

export interface ICollege extends Document {
  college_name: string;
}

const CollegeSchema = new Schema<ICollege>({
  college_name: {
    type: String,
    required: true,
    index: { unique: true }
  }
});

const College = model<ICollege>('College', CollegeSchema);

export default College;
