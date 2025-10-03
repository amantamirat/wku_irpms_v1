import { ApiClient } from "@/api/ApiClient";
import { Calendar, CalendarStatus } from "../models/calendar.model";
const end_point = '/calendars/';

export interface GetCalendarOptions {
    status?: CalendarStatus;
}

export const CalendarApi = {

    async createCalendar(calendar: Partial<Calendar>): Promise<Calendar> {
        const createdData = await ApiClient.post(end_point, calendar);
        return createdData as Calendar;
    },

    async getCalendars(options: GetCalendarOptions): Promise<Calendar[]> {
        const query = new URLSearchParams();
        if (options.status) query.append("status", options.status);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Calendar[];
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
