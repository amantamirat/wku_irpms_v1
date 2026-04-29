import mongoose, { Document, Schema } from 'mongoose';
import { COLLECTIONS } from '../../../common/constants/collections.enum';
import { Program } from '../../organization/organization.model';

export interface IEnrollment extends Document {
  calendar: mongoose.Types.ObjectId;
  program: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}


const EnrollmentSchema = new Schema<IEnrollment>({
  calendar: {
    type: Schema.Types.ObjectId,
    ref: COLLECTIONS.CALENDAR,
    required: true
  },
  program: {
    type: Schema.Types.ObjectId,
    ref: Program.modelName,
    required: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: COLLECTIONS.USER,
    required: true
  }
}, {
  timestamps: true
});

EnrollmentSchema.index({ student: 1, calendar: 1 }, { unique: true });

EnrollmentSchema.index({ student: 1, program: 1 }, { unique: true });

const Enrollment = mongoose.model<IEnrollment>(COLLECTIONS.ENROLLMENT, EnrollmentSchema);

export default Enrollment;
