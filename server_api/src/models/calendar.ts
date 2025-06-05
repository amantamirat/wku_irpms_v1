import { Document } from 'mongoose';
/**
 * Enum representing the calendar status.
 */
export enum Status {
  /** The calendar is active. */
  active = 'active',
  /** The calendar is closed. */
  closed = 'closed'
}

/**
 * Interface for Calendar documents.
 */
export interface ICalendar extends Document {
  /** The academic or fiscal year. */
  year: number;
  /** The start date of the calendar. */
  start_date: Date;
  /** The end date of the calendar. */
  end_date: Date;
  /** The status of the calendar. */
  status: Status;
  /** Auto-generated creation timestamp. */
  createdAt?: Date;
  /** Auto-generated update timestamp. */
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
    type: Date,
    required: true,
  },
  end_date: {
    type: Date,
    required: true,
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
