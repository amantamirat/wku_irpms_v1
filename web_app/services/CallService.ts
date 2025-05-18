import { Call } from "@/models/call";
import { MyService } from "./MyService";

const end_point = '/calls/';


export const CallService = {

    async getCalls(): Promise<Call[]> {
        const data = await MyService.get(end_point);
        return data as Call[];
    },

    async createCall(call: Partial<Call>): Promise<Call> {
        const createdData = await MyService.post(end_point, call);
        return createdData as Call;
    },

    async updateCall(call: Partial<Call>): Promise<Call> {
        if (!call._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${call._id}`;
        const updatedCall = await MyService.put(url, call);
        return updatedCall as Call;
    },

    async deleteCall(call: Partial<Call>): Promise<boolean> {
        if (!call._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${call._id}`;
        const response = await MyService.delete(url);
        return response;
    },
};
