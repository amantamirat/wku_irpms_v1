import { Calendar } from "@/models/calendar";
import { MyService } from "./MyService";

const end_point = '/calendars/';


export const CalendarService = {

    async getCalendars(): Promise<Calendar[]> {
        const data = await MyService.get(end_point);
        return data as Calendar[];
    },

    async createCalendar(calendar: Partial<Calendar>): Promise<Calendar> {
        const createdData = await MyService.post(end_point, calendar);
        return createdData as Calendar;
    },

    async updateCalendar(calendar: Partial<Calendar>): Promise<Calendar> {
        if (!calendar._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${calendar._id}`;
        const updatedCalendar = await MyService.put(url, calendar);
        return updatedCalendar as Calendar;
    },

    async deleteCalendar(calendar: Partial<Calendar>): Promise<boolean> {
        if (!calendar._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${calendar._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
