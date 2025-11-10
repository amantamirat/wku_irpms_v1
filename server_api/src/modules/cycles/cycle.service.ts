import { CacheService } from "../../util/cache/cache.service";
import { CalendarStatus } from "../calendar/calendar.enum";
import { Calendar } from "../calendar/calendar.model";
import { Grant } from "../grants/grant.model";
import { Center, Directorate } from "../organization/organization.model";
import { ThematicArea } from "../themes/theme.model";
import { CycleStatus } from "./cycle.d";

import {
    CreateCycleDto,
    DeleteCycleDto,
    GetCyclesOptions,
    UpdateCycleDto
} from "./cycle.dto";
import { Cycle } from "./cycle.model";

export class CycleService {

    private static async validateCycle(dto: CreateCycleDto) {
        let directorateId: string;
        if (dto.type === "Call") {

            const directorate = await Directorate.findById(dto.organization).lean();
            if (!directorate) throw new Error("Directorate Not Found!");
            directorateId = directorate._id.toString();

        } else if (dto.type === "Program") {

            const center = await Center.findById(dto.organization).lean();
            if (!center) throw new Error("Center Not Found!");
            directorateId = center.parent.toString();

        } else {
            throw new Error("Invalid cycle type");
        }

        const grant = await Grant.findOne({ _id: dto.grant, directorate: directorateId }).lean();
        if (!grant) throw new Error("Grant Not Found!");

        if (dto.theme) {
            const thematicArea = await ThematicArea.findOne({ _id: dto.theme, directorate: directorateId }).lean();
            if (!thematicArea) throw new Error("Thematic Area Not Found!");
        }

        const calendar = await Calendar.findOne({ _id: dto.calendar, status: CalendarStatus.active }).lean();
        if (!calendar) throw new Error("Calendar Not Found!");
    }

    // -----------------------
    // Create
    // -----------------------
    static async createCycle(dto: CreateCycleDto) {
        await CacheService.validateOwnership(dto.userId, dto.organization);
        await this.validateCycle(dto);
        const cycle = await Cycle.create({
            ...dto,
            status: dto.status ?? "planned" as CycleStatus
        });
        return cycle;
    }

    // -----------------------
    // Update
    // -----------------------
    static async updateCycle(dto: UpdateCycleDto) {
        const { id, data, userId } = dto;
        const cycle = await Cycle.findById(id);
        if (!cycle) throw new Error("Cycle not found");
        await CacheService.validateOwnership(userId, cycle.organization);
        Object.assign(cycle, data);
        return cycle.save();
    }

    // -----------------------
    // Fetch / Query
    // -----------------------
    static async getCycles(options: GetCyclesOptions) {
        const filter: any = {};
        if (options.userId) {
            const organizations = await CacheService.getUserOrganizations(options.userId);
            filter.organization = { $in: organizations };
        }
        if (options.calendar) filter.calendar = options.calendar;
        if (options.type) filter.type = options.type;
        if (options.grant) filter.grant = options.grant;
        if (options.status) filter.status = options.status;

        return await Cycle.find(filter).populate([
            { path: 'calendar' },
            { path: 'grant' },
            { path: 'theme' },
            { path: 'organization' },
            { path: 'firstStage' }
        ]).lean();
    }

    // -----------------------
    // Delete
    // -----------------------
    static async deleteCycle(dto: DeleteCycleDto) {
        const { id, userId } = dto;
        const cycle = await Cycle.findById(id);
        if (!cycle) throw new Error("Cycle not found");
        await CacheService.validateOwnership(userId, cycle.organization);
        return await cycle.deleteOne();
    }
}
