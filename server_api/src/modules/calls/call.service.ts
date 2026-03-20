import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { ICalendarReadRepository } from "../calendar/calendar.repository";
import { CalendarStatus } from "../calendar/calendar.state-machine";
import { IGrantRepository } from "../grants/grant.repository";
import { IOrganizationRepository } from "../organization/organization.repository";
import { IThematicRepository } from "../thematics/thematic.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallRepository } from "./call.repository";
import { CALL_TRANSITIONS } from "./call.state-machine";
import { CallStatus } from "./call.status";
import { IStageRepository } from "./stages/stage.repository";

export class CallService {

    constructor(
        private readonly repository: CallRepository,
        private readonly calendarRepo: ICalendarReadRepository,
        private readonly stageRepository: IStageRepository,
        private readonly organizationRepository: IOrganizationRepository,
        private readonly grantRepository: IGrantRepository,
        private readonly thematicRepository: IThematicRepository,
    ) {

    }

    async create(dto: CreateCallDTO) {
        const calendarDoc = await this.calendarRepo.findById(dto.calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.active) throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);

        const grantDoc = await this.grantRepository.findById(dto.grant);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== "active") throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);
        /*
        const directorateDoc = await this.organizationRepository.findById(dto.directorate);
        if (!directorateDoc || directorateDoc.type !== Unit.directorate) throw new AppError(ERROR_CODES.DIRECTORATE_NOT_FOUND);
         // if (dto.thematic) {
        const thematicsDoc = await this.thematicRepository.findById(dto.thematic);
        if (!thematicsDoc) throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);
        // }
        */
        const created = await this.repository.create({ ...dto, status: CallStatus.planned });
        return created;
    }

    async getCalls(options: GetCallsOptions) {
        return await this.repository.find({ ...options, populate: true });
    }

    async update(dto: UpdateCallDTO) {
        const { id, data } = dto;
        const updated = await this.repository.update(id, data);;
        if (!updated) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        return updated;
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
            /*
            if (await this.callRepository.exists({ calendar: id })) {
                throw new AppError(ERROR_CODES.CALL_ALREADY_EXISTS);
            }
            */
        }

        return await this.repository.update(id, {
            status: to
        });
    }

    /*

    async updateStatus(dto: UpdateCallStatusDTO) {
        const { id, status } = dto;
        const nextState = status;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new Error(ERROR_CODES.CALL_NOT_FOUND);
        const current = callDoc.status;
        // --- State Machine Validation ---
        CallStateMachine.validateTransition(current, nextState);
        if (nextState === CallStatus.planned) {
            const stages = await this.stageRepository.find({ call: id });
            if (stages.length > 0) {
                throw new AppError(ERROR_CODES.STAGE_ALREADY_EXISTS);
            }
        }
        const updated = await this.repository.update(dto.id, { status: nextState });
        return updated;
    }
*/
    async delete(dto: DeleteDto) {
        const { id, } = dto;
        const callDoc = await this.repository.findById(id);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.planned) throw new AppError(ERROR_CODES.CALENDAR_NOT_PLANNED);
        return await this.repository.delete(id);
    }
}
