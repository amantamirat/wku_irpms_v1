import mongoose, { Document, Schema } from 'mongoose';
import { COLLECTIONS } from '../../../util/collections.enum';
import { Program } from '../../organization/organization.model';

export interface IStudent extends Document {
  academic_calendar: mongoose.Types.ObjectId;
  program: mongoose.Types.ObjectId;
  applicant: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}



const StudentSchema = new Schema<IStudent>({
  academic_calendar: {
    type: Schema.Types.ObjectId,
    ref: COLLECTIONS.CALENDAR,
    required: true
  },
  program: {
    type: Schema.Types.ObjectId,
    ref: Program.modelName,
    required: true
  },
  applicant: {
    type: Schema.Types.ObjectId,
    ref: COLLECTIONS.APPLICANT,
    required: true
  }
}, {
  timestamps: true
});

StudentSchema.index({ applicant: 1, academic_calendar: 1 }, { unique: true });

StudentSchema.index({ applicant: 1, program: 1 }, { unique: true });

const Student = mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
