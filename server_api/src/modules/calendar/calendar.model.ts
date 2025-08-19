import { Document } from 'mongoose';
import mongoose, { Schema } from 'mongoose';
import { COLLECTIONS } from '../../enums/collections.enum';
import { Call } from '../call/call.model';


interface ICalendar extends Document {
  year: number;
  start_date: Date;
  end_date: Date;
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
  }
}, {
  timestamps: true
});

CalendarSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const callId = this._id;
  const isReferencedByCall = await Call.exists({ calendar: callId });
  if (isReferencedByCall) {
    const err = new Error(`Cannot delete: ${this.year} it is referenced in call.`);
    return next(err);
  }
  next();
});


export const Calendar = mongoose.model<ICalendar>(COLLECTIONS.CALENDAR, CalendarSchema);

