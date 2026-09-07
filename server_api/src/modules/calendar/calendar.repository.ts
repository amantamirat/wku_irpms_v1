import mongoose from "mongoose";
import { Calendar, ICalendar } from "./calendar.model";
import { CreateCalendarDTO, FilterCalendarDTO, UpdateCalendarDTO } from "./calendar.dto";


export interface ICalendarReadRepository {
    findById(id: string): Promise<ICalendar | null>;
    find(filter: FilterCalendarDTO): Promise<ICalendar[]>;
    findOne(dto: FilterCalendarDTO): Promise<ICalendar | null>;
}

export interface ICalendarRepository extends ICalendarReadRepository {
    create(data: CreateCalendarDTO): Promise<ICalendar>;
    update(id: string, data: UpdateCalendarDTO["data"]): Promise<ICalendar | null>;
    delete(id: string): Promise<ICalendar | null>;
}

export class CalendarRepository implements ICalendarRepository {

    async findById(id: string) {
        return Calendar.findById(new mongoose.Types.ObjectId(id))
            .lean<ICalendar>()
            .exec();
    }

    async findOne({ year, status }: FilterCalendarDTO) {
        const filter: Record<string, any> = {};

        if (year) {
            filter.year = year;
        }

        if (status) {
            filter.status = status;
        }

        return Calendar.findOne(filter)
            .lean<ICalendar>()
            .exec();
    }

    async find(filter: FilterCalendarDTO) {
        const query: any = {};
        if (filter.year) {
            query.year = filter.year;
        }
        if (filter.status) {
            query.status = filter.status;
        }
        return Calendar.find(query)
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
