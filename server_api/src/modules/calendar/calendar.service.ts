import { Cycle } from "../cycles/cycle.model";
import { CalendarStatus } from "./calendar.enum";
import { Calendar } from "./calendar.model";

export interface CreateCalendarDto {
    year: number;
    start_date: Date | string;
    end_date: Date | string;
    status?: CalendarStatus;
}

export interface GetCalendarOptions {
    status?: CalendarStatus;
}

export class CalendarService {

    static async createCalendar(data: CreateCalendarDto) {
        const createdCalendar = await Calendar.create({ ...data });
        return createdCalendar;
    }

    static async getCalendars(options: GetCalendarOptions) {
        const filter: any = {};
        if (options.status) filter.status = options.status;
        return await Calendar.find(filter).lean();
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
        const referencedByCycle = await Cycle.exists({ calendar: calendar._id });
        if (referencedByCycle) throw new Error(`Can not delete ${calendar.year}, cycle exist.`);
        return await calendar.deleteOne();
    }
}
