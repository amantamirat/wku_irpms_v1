import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CallRepository } from "../calls/call.repository";
import { CreateCalendarDTO, GetCalendarDTO, UpdateCalendarDTO, UpdateCalendarStatusDTO } from "./calendar.dto";
import { CalendarRepository } from "./calendar.repository";
import { CalendarStateMachine } from "./calendar.state-machine";
import { CalendarStatus } from "./calendar.status";

export class CalendarService {

    constructor(private readonly repository: CalendarRepository,
        private readonly callRepository: CallRepository,
    ) {
    }

    async create(dto: CreateCalendarDTO) {
        try {
            return await this.repository.create({ ...dto, status: CalendarStatus.planned });
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.CALENDAR_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async get(option: GetCalendarDTO) {
        const calendars = await this.repository.find(option);
        return calendars;
    }

    async update(dto: UpdateCalendarDTO) {
        const { id, data } = dto;
        try {
            const updated = await this.repository.update(id, data);
            if (!updated) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
            return updated;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.CALENDAR_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async updateStatus(dto: UpdateCalendarStatusDTO) {
        const { id, status: next } = dto;
        const calendarDoc = await this.repository.findById(id);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        const current = calendarDoc.status;
        CalendarStateMachine.validateTransition(current, next);
        if (next === CalendarStatus.planned) {
            const calls = await this.callRepository.find({ calendar: id });
            if (calls.length > 0) {
                throw new AppError(ERROR_CODES.CALLS_ALREADY_EXISTS);
            }
        }
        return await this.repository.updateStatus(id, dto);
    }

    async delete(id: string) {
        const calendarDoc = await this.repository.findById(id);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.planned) {
            throw new AppError(ERROR_CODES.CALENDAR_NOT_PLANNED);
        }
        return await this.repository.delete(id);
    }
}
