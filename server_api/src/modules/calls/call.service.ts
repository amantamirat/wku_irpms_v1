import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { ICalendarReadRepository } from "../calendar/calendar.repository";
import { CalendarStatus } from "../calendar/calendar.state-machine";
import { IGrantAllocationRepository } from "../grants/allocations/grant.allocation.repository";
import { AllocationStatus } from "../grants/allocations/grant.allocation.state-machine";
import { IGrantStageRepository } from "../grants/stages/grant.stage.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallRepository } from "./call.repository";
import { CALL_TRANSITIONS } from "./call.state-machine";
import { CallStatus } from "./call.status";
import { CallStageStatus } from "./stages/call.stage.model";
import { ICallStageRepository } from "./stages/call.stage.repository";

export class CallService {

    constructor(
        private readonly repository: CallRepository,
        private readonly grantAllocationRepo: IGrantAllocationRepository,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly callStageRepo: ICallStageRepository,
    ) {
    }

    async create(dto: CreateCallDTO) {
        const { grantAllocation } = dto;
        const grantAllocDoc = await this.grantAllocationRepo.findById(grantAllocation);
        if (!grantAllocDoc) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);
        if (grantAllocDoc.status !== AllocationStatus.active) throw new AppError(ERROR_CODES.ALLOCATION_NOT_ACTIVE);

        const grantStages = (await this.grantStageRepo.find({ grant: String(grantAllocDoc.grant) }));
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

    async getById(id: string, populate?: boolean) {
        const call = await this.repository.findById(id, populate);
        if (!call) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        return call;
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
            const activeStageExsit = await this.callStageRepo.exists({ call: id, status: CallStageStatus.active });
            if (activeStageExsit) {
                throw new AppError(ERROR_CODES.ACTIVE_CALL_STAGE_EXIST);
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
        await this.callStageRepo.deleteByCall(id);
        return deleted;
    }
}
