
import { CallStatus } from "./call.enum";
import { Call } from "./call.model";
import { Directorate } from "../organization/organization.model";
import mongoose from "mongoose";
import { Catalog } from "./themes/theme.model";
import { Calendar } from "../calendar/calendar.model";
import { Evaluation } from "./evaluations/evaluation.model";
import { Grant } from "../grants/grant.model";
import { Project } from "../project/project.model";
import { CalendarStatus } from "../calendar/calendar.enum";


export interface GetCallsOptions {
    calendar?: mongoose.Types.ObjectId;
    directorate?: mongoose.Types.ObjectId;
    status?: CallStatus;
}

export interface CreateCallDto {
    directorate: mongoose.Types.ObjectId;
    calendar: mongoose.Types.ObjectId;
    title: string;
    deadline: Date | string;
    description?: string;
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
        const calendar = await Calendar.findOne({ _id: call.calendar, status: CalendarStatus.active });
        if (!calendar) {
            throw new Error("Calendar Not Found!");
        }
        const grant = await Grant.findById(call.grant);
        if (!grant) {
            throw new Error("Grant Not Found!");
        }
        const catalog = await Catalog.findById(call.theme);
        if (!catalog) {
            throw new Error("Theme Catalog Not Found!");
        }
        const evaluation = await Evaluation.findById(call.evaluation);
        if (!evaluation) {
            throw new Error("Evaluation Not Found!");
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
        return await Call.find(filter).populate([
            { path: 'calendar' },
            { path: 'directorate' },
            { path: 'theme' },
            { path: 'evaluation' },
            { path: 'grant' },
        ]).lean();
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
        const referencedByProject = await Project.exists({ call: call._id });
        if (referencedByProject) throw new Error(`Can not delete ${call.title}, it is referenced in projects.`);
        return await call.deleteOne();
    }
}
