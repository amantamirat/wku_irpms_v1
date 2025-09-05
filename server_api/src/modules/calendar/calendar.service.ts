import { Calendar } from "./calendar.model";



export interface CreateCalendarDto {
  year: number;
  start_date: Date | string; 
  end_date: Date | string;
}


export class CalendarService {

    static async createCalendar(data: CreateCalendarDto) {
        const createdCalendar = await Calendar.create({ ...data });
        return createdCalendar;
    }

    static async getCalendars() {        
        return await Calendar.find().lean();
    }

    static async updateCalendar(id: string, data: Partial<CreateCalendarDto>) {
        const calendar = await Calendar.findById(id);
        if (!calendar) throw new Error("Calendar not found");
        Object.assign(calendar, data);
        return calendar.save();
    }

    static async deleteCalendar(id: string) {
        const calendar = await Calendar.findById(id);
        if (!calendar) throw new Error("Calendar not found");
        return await calendar.deleteOne();
    }
}
