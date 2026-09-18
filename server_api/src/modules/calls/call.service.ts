import { DeleteDto } from "../../common/dtos/delete.dto";
import { FilterOptions } from "../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { CalendarStatus } from "../calendar/calendar.model";
import { ICalendarRepository } from "../calendar/calendar.repository";
import { GrantStatus } from "../grants/grant.model";
import { IGrantRepository } from "../grants/grant.repository";
import { IProjectRepository } from "../projects/project.repository";
import { CreateCallDTO, FilterCallDTO, UpdateCallDTO } from "./call.dto";
import { CallStatus } from "./call.model";
import { ICallRepository } from "./call.repository";
import { StageService } from "./stages/stage.service";

export class CallService {

    constructor(
        private readonly repository: ICallRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly calendarRepo: ICalendarRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly stageService: StageService
    ) {
    }

    async create(dto: CreateCallDTO, userId: string) {
        const { stages, ...callData } = dto;

        if (!stages?.length) {
            throw new AppError(ERROR_CODES.STAGE_REQUIRED);
        }

        // Validate Grant
        const grantDoc = await this.grantRepo.findById(callData.grant);

        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        if (grantDoc.status !== GrantStatus.active) {
            throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);
        }

        // Validate Calendar
        const calendarDoc = await this.calendarRepo.findById(callData.calendar);

        if (!calendarDoc) {
            throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        }

        if (calendarDoc.status !== CalendarStatus.active) {
            throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);
        }

        // -----------------------------------------
        // Validate ALL stages BEFORE creating call
        // -----------------------------------------

        for (const stage of stages) {
            await this.stageService.validateCreate({
                ...stage,
                call: "validation"
            });
        }

        // -----------------------------------------
        // Create Call
        // -----------------------------------------

        const call = await this.repository.create({
            ...callData,
            organization: String(grantDoc.organization),
            status: CallStatus.planned
        }, userId);

        // -----------------------------------------
        // Create stages
        // -----------------------------------------

        for (const stage of stages) {

            await this.stageService.create({
                ...stage, call: String(call._id)
            }, userId);
        }

        return this.repository.findById(String(call._id), { populate: true });
    }

    async getCalls(filter: FilterCallDTO, options?: FilterOptions) {
        return await this.repository.find(filter, options);
    }

    async getById(id: string, options?: FilterOptions) {
        const call = await this.repository.findById(id, options);
        if (!call) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        return call;
    }

    async update(dto: UpdateCallDTO, userId: string) {
        const { id, data } = dto;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) {
            throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        }
        return await this.repository.update(id, data, userId);
    }

    async transitionState(dto: TransitionRequestDto, userId: string) {
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
                    ERROR_CODES.CALL_DEADLINE_NOT_SET
                );
            }
        }

        return await this.repository.updateStatus(id, to, userId);
    }


    async delete(dto: DeleteDto) {
        const { id, } = dto;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.planned) throw new AppError(ERROR_CODES.CALL_NOT_PLANNED);
        const hasStages = await this.stageService.exists({ call: id });
        if (hasStages) {
            throw new AppError(
                ERROR_CODES.STAGE_ALREADY_EXISTS,
                "Cannot delete call because it has stages"
            );
        }
        return await this.repository.delete(id);
    }
}
export const CALL_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
    [CallStatus.planned]: [CallStatus.active],
    [CallStatus.active]: [CallStatus.closed, CallStatus.planned],
    [CallStatus.closed]: [CallStatus.active]
};

