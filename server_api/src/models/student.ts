import { Document, Types } from 'mongoose';

export interface IStudent extends Document {
  applicant: Types.ObjectId;
  academic_calendar: Types.ObjectId;
  program: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

import mongoose, { Schema } from 'mongoose';

const StudentSchema = new Schema<IStudent>({
  applicant: {
    type: Schema.Types.ObjectId,
    ref: 'Applicant',
    required: true
  },
  academic_calendar: {
    type: Schema.Types.ObjectId,
    ref: 'AcademicCalendar',
    required: true
  },
  program: {
    type: Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  }
}, {
  timestamps: true
});

StudentSchema.index({ applicant: 1, academic_calendar: 1 }, { unique: true });

StudentSchema.index({ applicant: 1, program: 1 }, { unique: true });

const Student = mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
