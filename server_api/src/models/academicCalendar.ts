import { Document } from 'mongoose';

export interface IAcademicCalendar extends Document {
  year: number;
  start_date?: Date;
  end_date?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

import mongoose, { Schema } from 'mongoose';

const AcademicCalendarSchema = new Schema<IAcademicCalendar>({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  }
}, {
  timestamps: true
});

const AcademicCalendar = mongoose.model<IAcademicCalendar>('AcademicCalendar', AcademicCalendarSchema);

export default AcademicCalendar;
