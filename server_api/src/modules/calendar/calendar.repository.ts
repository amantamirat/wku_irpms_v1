import mongoose from "mongoose";
import { Calendar, ICalendar } from "./calendar.model";
import { CreateCalendarDTO, UpdateCalendarDTO } from "./calendar.dto";

export interface ICalendarRepository {
    findById(id: string): Promise<ICalendar | null>;
    findAll(): Promise<ICalendar[]>;
    create(data: CreateCalendarDTO): Promise<ICalendar>;
    update(id: string, data: UpdateCalendarDTO["data"]): Promise<ICalendar>;
    delete(id: string): Promise<void>;
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

    async update(id: string, dtoData: UpdateCalendarDTO["data"]) {
        const toUpdate: any = {};

        if (dtoData.year !== undefined) {
            toUpdate.year = dtoData.year;
        }
        if (dtoData.startDate) {
            toUpdate.startDate = dtoData.startDate;
        }
        if (dtoData.endDate) {
            toUpdate.endDate = dtoData.endDate;
        }
        if (dtoData.status) {
            toUpdate.status = dtoData.status;
        }

        const updated = await Calendar.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<ICalendar>();

        if (!updated) {
            throw new Error("Calendar not found.");
        }

        return updated;
    }


    async delete(id: string) {
        await Calendar.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
