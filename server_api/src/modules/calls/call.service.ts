import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { CalendarStatus } from "../calendar/calendar.model";
import { ICalendarRepository } from "../calendar/calendar.repository";
import { GrantStatus } from "../grants/grant.model";
import { IGrantRepository } from "../grants/grant.repository";
import { IProjectRepository } from "../projects/project.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallStatus } from "./call.model";
import { ICallRepository } from "./call.repository";

export class CallService {

    constructor(
        private readonly repository: ICallRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly calendarRepo: ICalendarRepository,
        private readonly projectRepo: IProjectRepository,
    ) {
    }

    async create(dto: CreateCallDTO) {
        const { grant } = dto;

        // 1. Fetch parent grant & validate
        const grantDoc = await this.grantRepo.findById(grant);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.active) throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);

        const calendarDoc = await this.calendarRepo.findById(dto.calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.active) throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);

        // 6. Create the Call
        const created = await this.repository.create({
            ...dto,
            organization: String(grantDoc.organization),
            status: CallStatus.planned
        });

        return created;
    }

    async getCalls(options: GetCallsOptions) {
        return await this.repository.find(options);
    }

    async getById(id: string, populate?: boolean) {
        const call = await this.repository.findById(id, populate);
        if (!call) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        return call;
    }

    async update(dto: UpdateCallDTO) {
        const { id, data } = dto;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) {
            throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        }
        return await this.repository.update(id, data);
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const callDoc = await this.repository.findById(id);
        if (!callDoc) {
            throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        }
        const from = callDoc.status as CallStatus;
        const to = next as CallStatus;
        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            CALL_TRANSITIONS
        );

        if (next === CallStatus.planned) {
            if (await this.projectRepo.exists({ call: id })) {
                throw new AppError(
                    ERROR_CODES.CALL_IN_USE,
                    'This call is already being used by projects.'
                );
            }
        }

        if (next === CallStatus.active) {
            if (!callDoc.deadline) {
                throw new AppError(
                    ERROR_CODES.DEADLINE_NOT_FOUND
                );
            }
        }

        return await this.repository.updateStatus(id, to);
    }


    async delete(dto: DeleteDto) {
        const { id, } = dto;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.planned) throw new AppError(ERROR_CODES.CALL_NOT_PLANNED);
        const deleted = await this.repository.delete(id);
        //await this.callStageRepo.deleteByCall(id);
        return deleted;
    }
}
export const CALL_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
    [CallStatus.planned]: [CallStatus.active],
    [CallStatus.active]: [CallStatus.closed, CallStatus.planned],
    [CallStatus.closed]: [CallStatus.active]
};

