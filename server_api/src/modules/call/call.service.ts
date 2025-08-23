import { Types } from "mongoose";
import { CallStatus } from "./enums/call.status.enum";
import { Call } from "./call.model";
import { Directorate } from "../organs/base.organization.model";


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
    grant: Types.ObjectId | string;
    status?: CallStatus;
}


export class CallService {

    private static async validateCall(theme: Partial<CreateCallDto>) {
        const directorate = await Directorate.findById(theme.directorate);
        if (!directorate) {
            throw new Error("Directorate Not Found!");
        }
        return
    }

    static async createCall(data: CreateCallDto) {
        await this.validateCall(data);
        const createdCall = await Call.create({ ...data });
        return createdCall;
    }

    static async getCalls(options: GetCallsOptions) {
        const filter: any = {};
        if (options.calendar) filter.calendar = options.calendar;
        if (options.directorate) filter.directorate = options.directorate;
        return Call.find(filter).populate('calendar').populate('directorate').populate('grant').lean();
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
