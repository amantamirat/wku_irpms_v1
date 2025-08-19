import { ApiClient } from "@/api/ApiClient";
import { Calendar } from "../models/calendar.model";
const end_point = '/calendars/';


export const CalendarApi = {

    async getCalendars(): Promise<Calendar[]> {
        const data = await ApiClient.get(end_point);
        return data as Calendar[];
    },

    async createCalendar(calendar: Partial<Calendar>): Promise<Calendar> {
        const createdData = await ApiClient.post(end_point, calendar);
        return createdData as Calendar;
    },

    async updateCalendar(calendar: Partial<Calendar>): Promise<Calendar> {
        if (!calendar._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${calendar._id}`;
        const updatedCalendar = await ApiClient.put(url, calendar);
        return updatedCalendar as Calendar;
    },

    async deleteCalendar(calendar: Partial<Calendar>): Promise<boolean> {
        if (!calendar._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${calendar._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
