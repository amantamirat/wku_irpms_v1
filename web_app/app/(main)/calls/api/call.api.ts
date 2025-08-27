import { ApiClient } from "@/api/ApiClient";
import { Call } from "../models/call.model";
import { Calendar } from "../../calendars/models/calendar.model";
import { Organization } from "../../organizations/models/organization.model";


const end_point = '/calls';

function sanitizeCall(call: Partial<Call>): Partial<Call> {
    return {
        ...call,
        directorate:
            typeof call.directorate === 'object' && call.directorate !== null
                ? (call.directorate as Organization)._id
                : call.directorate,
        calendar:
            typeof call.calendar === 'object' && call.calendar !== null
                ? (call.calendar as Calendar)._id
                : call.calendar,
    };
}

export interface GetCallsOptions {
    calendar?: string;
    directorate?: string;
}

export const CallApi = {

    async createCall(call: Partial<Call>): Promise<Call> {
        const sanitized = sanitizeCall(call);
        const createdData = await ApiClient.post(end_point, sanitized);
        return createdData as Call;
    },

    async getCalls(options: GetCallsOptions): Promise<Call[]> {
        const query = new URLSearchParams();
        if (options.calendar) query.append("calendar", options.calendar);
        if (options.directorate) query.append("directorate", options.directorate);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Call[];
    },


    async updateCall(call: Partial<Call>): Promise<Call> {
        if (!call._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${call._id}`;
        const sanitized = sanitizeCall(call);
        const updatedCall = await ApiClient.put(url, sanitized);
        return updatedCall as Call;
    },

    async deleteCall(call: Partial<Call>): Promise<boolean> {
        if (!call._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}/${call._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },
};
