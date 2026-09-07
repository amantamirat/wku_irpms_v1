import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { Calendar, FilterCalendarOptions } from "../models/calendar.model";
import { TransitionRequestDto } from "@/types/util";

const end_point = "/calendars";

export const CalendarApi: EntityApi<Calendar, FilterCalendarOptions | undefined> = {

    async getAll(options?: FilterCalendarOptions) {
        return ApiClient.get(end_point, options);
    },

    async lookup(options) {
        return ApiClient.get(`${end_point}/lookup`, options);
    },

    async getById(id: string): Promise<Calendar> {
        const url = `${end_point}/${id}`;
        const data = await ApiClient.get(url);
        return data as Calendar;
    },

    async create(calendar) {
        return ApiClient.post(end_point, calendar);
    },

    async update(calendar) {
        if (!calendar._id) throw new Error("_id required");

        return ApiClient.put(`${end_point}/${calendar._id}`, calendar);
    },

    async delete(calendar) {
        if (!calendar._id) throw new Error("_id required");

        return ApiClient.delete(`${end_point}/${calendar._id}`);
    },

    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    }

};