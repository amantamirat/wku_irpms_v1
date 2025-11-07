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
import { CreateCallDto, DeleteCallDTO, GetCallsOptions, UpdateCallDto } from "./call.dto";



export class CallService {

    private static async validateCall(call: CreateCallDto) {
        const calendar = await Calendar.findOne({ _id: call.calendar, status: CalendarStatus.active }).lean();
        if (!calendar) throw new Error("Calendar Not Found!");

        const directorate = await Directorate.findById(call.directorate).lean();
        if (!directorate) throw new Error("Directorate Not Found!");

        const grant = await Grant.findOne({_id: call.grant, directorate:directorate._id}).lean();
        if (!grant) throw new Error("Grant Not Found!");

        const thematicArea = await ThematicArea.findOne({_id: call.theme, directorate:directorate._id}).lean();
        if (!thematicArea) throw new Error("Thematic Area Not Found!");
    }

    static async createCall(dto: CreateCallDto) {
        await CacheService.validateOwnership(dto.userId, dto.directorate);
        await this.validateCall(dto);
        const createdCall = await Call.create({ ...dto, status: CallStatus.planned });
        return createdCall;
    }

    static async getCalls(options: GetCallsOptions) {
        const filter: any = {};
        if (options.userId) {
            const organizations = await CacheService.getUserOrganizations(options.userId);
            filter.directorate = { $in: organizations };
        } else if (options.directorate) {
            filter.directorate = options.directorate;
        }
        if (options.calendar) filter.calendar = options.calendar;
        if (options.status) filter.status = options.status;
        return await Call.find(filter).populate([
            { path: 'calendar' },
            { path: 'directorate' },
            { path: 'theme' },
            { path: 'grant' },
        ]).lean();
    }

    /*

    static async getUserCalls(userId: string) {
        // Get directorates/organizations the user belongs to
        const organizations = await CacheService.getUserOrganizations(userId);
        //if (options?.status) filter.status = options.status;
        const calls = await Call.find({ directorate: { $in: organizations } }).populate([
            { path: 'calendar' },
            { path: 'directorate' },
            { path: 'theme' },
            { path: 'grant' }
        ]).lean();
        //console.log(calls);
        return calls;
    }

    */

    /*
        static async getCallById(id: mongoose.Types.ObjectId) {
            return await Call.findById(id).lean();
        }
    */

    static async updateCall(dto: UpdateCallDto) {
        const { id, data, userId } = dto;
        const call = await Call.findById(id);
        if (!call) throw new Error("Call not found");
        await CacheService.validateOwnership(userId, call.directorate);
        Object.assign(call, data);
        return call.save();
    }

    static async deleteCall(dto: DeleteCallDTO) {
         const { id, userId } = dto;
        const call = await Call.findById(id);
        if (!call) throw new Error("Call not found");
        await CacheService.validateOwnership(userId, call.directorate);

        //const referencedByProject = await Project.exists({ call: call._id });
        //if (referencedByProject) throw new Error(`Cannot delete ${call.title}, it is referenced in projects.`);

        return await call.deleteOne();
    }
}
