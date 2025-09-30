import { Call } from "../call/call.model";
import { CalendarStatus } from "./calendar.enum";
import { Calendar } from "./calendar.model";



export interface CreateCalendarDto {
    year: number;
    start_date: Date | string;
    end_date: Date | string;
    status?: CalendarStatus;
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
        const referencedByCall = await Call.exists({ calendar: calendar._id });
        if (referencedByCall) throw new Error(`Can not delete ${calendar.year}, it is referenced in call.`);
        return await calendar.deleteOne();
    }
}
