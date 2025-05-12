import { Document } from 'mongoose';

export enum Status {
  active = 'active',
  closed = 'closed'
}

export interface ICalendar extends Document {
  year: number;
  start_date?: Date;
  end_date?: Date;
  status: Status;
  createdAt?: Date;
  updatedAt?: Date;
}

import mongoose, { Schema } from 'mongoose';

const CalendarSchema = new Schema<ICalendar>({
  year: {
    type: Number,
    min: 1970,
    max: 8888,
    required: true,
    unique: true
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  status: {
    type: String,
    enum: Object.values(Status),
    required: true,
    default: Status.active
  }
}, {
  timestamps: true
});

const Calendar = mongoose.model<ICalendar>('Calendar', CalendarSchema);

export default Calendar;
