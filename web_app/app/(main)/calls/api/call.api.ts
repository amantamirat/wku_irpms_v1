import { ApiClient } from "@/api/ApiClient";
import { Call, CallStatus, sanitizeCall } from "../models/call.model";


const end_point = '/calls';

export interface GetCallsOptions {
    calendar?: string;
    directorate?: string;
    status?: CallStatus;
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
        if (options.status) query.append("status", options.status);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data as Call[];
    },

    async getUserCalls(): Promise<Call[]> {
        const data = await ApiClient.get(`${end_point}/user`);
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
