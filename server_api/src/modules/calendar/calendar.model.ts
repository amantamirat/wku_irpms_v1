import { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import { COLLECTIONS } from '../../common/constants/collections.enum';
import { CalendarStatus } from './calendar.state-machine';



export interface ICalendar extends Document {
  year: number;
  startDate: Date;
  endDate: Date;
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
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(CalendarStatus),
    default: CalendarStatus.planned,
    required: true
  },
}, {
  timestamps: true
});

export const Calendar = mongoose.model<ICalendar>(COLLECTIONS.CALENDAR, CalendarSchema);

