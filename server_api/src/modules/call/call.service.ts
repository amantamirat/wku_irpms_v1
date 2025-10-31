import mongoose from "mongoose";
import { CallStatus } from "./call.enum";
import { Call } from "./call.model";
import { Directorate } from "../organization/organization.model";
import { ThematicArea } from "../themes/theme.model";
import { Calendar } from "../calendar/calendar.model";
import { Grant } from "../grants/grant.model";
import { Project } from "../project/project.model";
import { CalendarStatus } from "../calendar/calendar.enum";
import { CacheService } from "../../util/cache/cache.service";

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
        const directorate = await Directorate.findById(call.directorate).lean();
        if (!directorate) throw new Error("Directorate Not Found!");

        const calendar = await Calendar.findOne({ _id: call.calendar, status: CalendarStatus.active }).lean();
        if (!calendar) throw new Error("Calendar Not Found!");

        const grant = await Grant.findById(call.grant).lean();
        if (!grant) throw new Error("Grant Not Found!");

        const thematicArea = await ThematicArea.findById(call.theme).lean();
        if (!thematicArea) throw new Error("Thematic Area Not Found!");
    }

    static async createCall(data: CreateCallDto, userId: string) {
        await CacheService.validateOwnership(userId, data.directorate);
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


    static async getUserCalls(userId: string) {
        // Get directorates/organizations the user belongs to
        const organizations = await CacheService.getUserOrganizations(userId);
        //if (options?.status) filter.status = options.status;
        const calls = await Call.find({ directorate: { $in: organizations } }).populate([
            { path: 'calendar' },
            { path: 'directorate' },
            { path: 'theme' },
            { path: 'evaluation' },
            { path: 'grant' },
        ]).lean();
        //console.log(calls);
        return calls;
    }


    static async getCallById(id: mongoose.Types.ObjectId) {
        return await Call.findById(id).lean();
    }

    static async updateCall(id: string, data: Partial<CreateCallDto>, userId: string) {
        const call = await Call.findById(id);
        if (!call) throw new Error("Call not found");
        await CacheService.validateOwnership(userId, call.directorate);
        Object.assign(call, data);
        return call.save();
    }

    static async deleteCall(id: string, userId: string) {
        const call = await Call.findById(id);
        if (!call) throw new Error("Call not found");
        await CacheService.validateOwnership(userId, call.directorate);

        const referencedByProject = await Project.exists({ call: call._id });
        if (referencedByProject) throw new Error(`Cannot delete ${call.title}, it is referenced in projects.`);

        return await call.deleteOne();
    }
}
