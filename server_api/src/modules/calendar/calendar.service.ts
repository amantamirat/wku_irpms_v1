import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { CallRepository } from "../calls/call.repository";
import { CreateCalendarDTO, GetCalendarDTO, UpdateCalendarDTO } from "./calendar.dto";
import { CalendarRepository } from "./calendar.repository";
import { CALENDAR_TRANSITIONS, CalendarStatus } from "./calendar.state-machine";


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

    async getById(id: string) {
        const calendar = await this.repository.findById(id);
        if (!calendar) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        return calendar;
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

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const calendarDoc = await this.repository.findById(id);
        if (!calendarDoc) {
            throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        }
        const from = calendarDoc.status as CalendarStatus;
        const to = next as CalendarStatus;
        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            CALENDAR_TRANSITIONS
        );

        if (next === CalendarStatus.planned) {
            if (await this.callRepository.exists({ calendar: id })) {
                throw new AppError(ERROR_CODES.CALL_ALREADY_EXISTS);
            }
        }

        return await this.repository.update(id, {
            status: to
        });
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
