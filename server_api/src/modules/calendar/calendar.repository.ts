import mongoose from "mongoose";
import { Calendar, ICalendar } from "./calendar.model";
import { CreateCalendarDTO, UpdateCalendarDTO, UpdateCalendarStatusDTO } from "./calendar.dto";

export interface ICalendarRepository {
    findById(id: string): Promise<ICalendar | null>;
    findAll(): Promise<ICalendar[]>;
    create(data: CreateCalendarDTO): Promise<ICalendar>;
    update(id: string, data: UpdateCalendarDTO["data"]): Promise<ICalendar | null>;
    updateStatus(id: string, data: UpdateCalendarStatusDTO): Promise<ICalendar | null>;
    delete(id: string): Promise<ICalendar | null>;
}

export class CalendarRepository implements ICalendarRepository {

    async findById(id: string) {
        return Calendar.findById(new mongoose.Types.ObjectId(id))
            .lean<ICalendar>()
            .exec();
    }

    async findAll() {
        return Calendar.find()
            .sort({ year: -1 })
            .lean<ICalendar[]>()
            .exec();
    }

    async create(dto: CreateCalendarDTO) {
        const data: Partial<ICalendar> = {
            year: dto.year,
            startDate: dto.startDate,
            endDate: dto.endDate,
            status: dto.status ?? undefined
        };

        return Calendar.create(data);
    }

    async update(id: string, data: UpdateCalendarDTO["data"]) {
        const toUpdate: any = {};

        if (data.year !== undefined) {
            toUpdate.year = data.year;
        }
        if (data.startDate) {
            toUpdate.startDate = data.startDate;
        }
        if (data.endDate) {
            toUpdate.endDate = data.endDate;
        }

        return Calendar.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<ICalendar>();
    }

    async updateStatus(id: string, data: UpdateCalendarStatusDTO) {
        const toUpdate: any = {};
        if (data.status) {
            toUpdate.status = data.status;
        }
        return Calendar.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<ICalendar>();
    }


    async delete(id: string) {
        return Calendar.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
