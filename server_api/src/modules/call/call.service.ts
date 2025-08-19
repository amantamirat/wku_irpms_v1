import { Types } from "mongoose";
import { CallStatus } from "./enums/call.status.enum";
import { Call } from "./call.model";


export interface GetCallsOptions {
    calendar?: Types.ObjectId | string;
    directorate?: string;
}


export interface CreateCallDto {
    directorate: Types.ObjectId | string;
    calendar: Types.ObjectId | string;
    title: string;
    dead_line: Date | string;
    description?: string;
    total_budget?: number;
    status?: CallStatus;
}


export class CallService {

    static async createCall(data: CreateCallDto) {
        const createdCall = await Call.create({ ...data });
        return createdCall;
    }

    static async getCalls(options: GetCallsOptions) {
        const filter: any = {};
        if (options.calendar) filter.calendar = options.calendar;
        if (options.directorate) filter.directorate = options.directorate;
        return Call.find(filter).populate('calendar').populate('directorate').lean();
    }

    static async updateCall(id: string, data: Partial<CreateCallDto>) {
        const call = await Call.findById(id);
        if (!call) throw new Error("Call not found");
        Object.assign(call, data);
        return call.save();
    }

    static async deleteCall(id: string) {
        const call = await Call.findById(id);
        if (!call) throw new Error("Call not found");
        return await call.deleteOne();
    }
}
