import { ApiClient } from "@/api/ApiClient";
import { Calendar, CalendarStatus } from "../models/calendar.model";
const end_point = '/calendars';

export interface GetCalendarOptions {
    status?: CalendarStatus;
}

export const CalendarApi = {

    async create(calendar: Partial<Calendar>): Promise<Calendar> {
        const createdData = await ApiClient.post(end_point, calendar);
        return createdData as Calendar;
    },

    async getCalendars(): Promise<Calendar[]> {
        const data = await ApiClient.get(end_point);
        return data as Calendar[];
    },

    async update(calendar: Partial<Calendar>): Promise<Calendar> {
        if (!calendar._id) { throw new Error("_id required."); }
        const url = `${end_point}/${calendar._id}`;
        const updatedCalendar = await ApiClient.put(url, calendar);
        return updatedCalendar as Calendar;
    },

    async updateStatus(id: string, status: CalendarStatus): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, { status });
        return updated;
    },

    async delete(calendar: Partial<Calendar>): Promise<boolean> {
        if (!calendar._id) { throw new Error("_id required."); }
        const url = `${end_point}/${calendar._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
