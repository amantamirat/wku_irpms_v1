
import { CallStatus } from "./enums/call.status.enum";
import { Call } from "./call.model";
import { Directorate } from "../organs/base.organization.model";
import mongoose from "mongoose";


export interface GetCallsOptions {
    calendar?: mongoose.Types.ObjectId;
    directorate?: string;
    status?: CallStatus;
}

export interface CreateCallDto {
    directorate: mongoose.Types.ObjectId;
    calendar: mongoose.Types.ObjectId;
    title: string;
    deadline: Date | string;
    description?: string;
    total_budget?: number;
    grant: mongoose.Types.ObjectId;
    theme: mongoose.Types.ObjectId;
    evaluation: mongoose.Types.ObjectId;
    status?: CallStatus;
}


export class CallService {

    private static async validateCall(call: Partial<CreateCallDto>) {
        const directorate = await Directorate.findById(call.directorate);
        if (!directorate) {
            throw new Error("Directorate Not Found!");
        }
        return
    }

    static async createCall(data: CreateCallDto) {
        await this.validateCall(data);
        const createdCall = await Call.create({ ...data, status: CallStatus.planned });
        return createdCall;
    }

    static async getCalls(options: GetCallsOptions) {
        const filter: any = {};
        if (options.calendar) filter.calendar = options.calendar;
        if (options.directorate) filter.directorate = options.directorate;
        if (options.status) filter.status = options.status;
        return await Call.find(filter).populate('calendar').populate('directorate').populate('theme').populate('evaluation').populate('grant').lean();
    }


    static async getCallById(id: mongoose.Types.ObjectId) {
        return await Call.findById(id).lean();
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
