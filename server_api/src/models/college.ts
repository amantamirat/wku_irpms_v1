import { Schema, model, Document } from 'mongoose';
import Department from './department';

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

CollegeSchema.pre('findOneAndDelete', async function (next) {
  const college = await this.model.findOne(this.getQuery());
  if (!college) return next();
  const isReferenced = await Department.exists({ college: college._id });
  if (isReferenced) {
    return next(new Error('Cannot delete college: it has departments.'));
  }
  next();
});

const College = model<ICollege>('College', CollegeSchema);

export default College;
