import { Cycle } from "../cycles/cycle.model";
import { CreateCalendarDTO, UpdateCalendarDTO } from "./calendar.dto";
import { ICalendarRepository, CalendarRepository } from "./calendar.repository";

export class CalendarService {

    private repository: ICalendarRepository;

    constructor(repository?: ICalendarRepository) {
        this.repository = repository || new CalendarRepository();
    }

    async create(dto: CreateCalendarDTO) {
        return await this.repository.create(dto);
    }

    async getAll() {
        const calendars = await this.repository.findAll();
        return calendars;
    }

    async update(dto: UpdateCalendarDTO) {
        const { id, data } = dto;

        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error("Calendar not found.");

        return updated;
    }

    async delete(id: string) {
        // Check if referenced by Cycle
        const exists = await Cycle.exists({ calendar: id });
        if (exists) {
            throw new Error("Cannot delete calendar: A cycle is already linked to this calendar.");
        }
        // Perform delete
        await this.repository.delete(id);
        return { message: "Calendar deleted successfully" };
    }
}
