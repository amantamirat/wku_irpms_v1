import { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import { COLLECTIONS } from '../../enums/collections.enum';
import { CalendarStatus } from './calendar.enum';


interface ICalendar extends Document {
  year: number;
  start_date: Date;
  end_date: Date;
  status: CalendarStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

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
    enum: Object.values(CalendarStatus),
    default: CalendarStatus.active,
    required: true
  },
}, {
  timestamps: true
});


export const Calendar = mongoose.model<ICalendar>(COLLECTIONS.CALENDAR, CalendarSchema);

