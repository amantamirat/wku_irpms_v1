import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { ICalendarReadRepository } from "../calendar/calendar.repository";
import { CalendarStatus } from "../calendar/calendar.state-machine";
import { IGrantStageRepository } from "../grants/stages/grant.stage.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallRepository } from "./call.repository";
import { CALL_TRANSITIONS } from "./call.state-machine";
import { CallStatus } from "./call.status";
import { ICallStageRepository } from "./stages/call.stage.repository";

export class CallService {

    constructor(
        private readonly repository: CallRepository,
        private readonly calendarRepo: ICalendarReadRepository,
        private readonly callStageRepo: ICallStageRepository,
        private readonly grantStageRepo: IGrantStageRepository,
    ) {

    }

    async create(dto: CreateCallDTO) {
        const calendarDoc = await this.calendarRepo.findById(dto.calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.active) throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);

        const grantStages = (await this.grantStageRepo.find({ grant: dto.grant }));
        if (grantStages.length === 0)
            throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);

        const created = await this.repository.create({ ...dto, status: CallStatus.planned });

        let currentDate = new Date();
        const callStagesPayload = grantStages.map(gs => {
            //currentDate.setDate(currentDate.getDate() + (gs.duration || 7));
            currentDate.setDate(currentDate.getDate() + (gs.order * 7));
            return {
                call: String(created._id),
                grantStage: gs._id,
                order: gs.order,
                deadline: new Date(currentDate)
            };
        });

        await this.callStageRepo.createMany(callStagesPayload);

        return created;
    }

    async getCalls(options: GetCallsOptions) {
        return await this.repository.find(options);
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
        if (callDoc.status !== CallStatus.planned) throw new AppError(ERROR_CODES.CALL_NOT_PLANNED);
        const deleted = await this.repository.delete(id);
        await this.callStageRepo.deleteByCall(id);
        return deleted;
    }
}
