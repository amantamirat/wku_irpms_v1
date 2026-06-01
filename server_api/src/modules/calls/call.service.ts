import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { CalendarStatus } from "../calendar/calendar.model";
import { ICalendarRepository } from "../calendar/calendar.repository";
import { GrantStatus } from "../grants/grant.model";
import { IGrantRepository } from "../grants/grant.repository";
import { StageCategory } from "../grants/stages/grant.stage.model";
import { IGrantStageRepository } from "../grants/stages/grant.stage.repository";
import { IProjectRepository } from "../projects/project.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallStatus } from "./call.model";
import { CallRepository } from "./call.repository";

export class CallService {

    constructor(
        private readonly repository: CallRepository,        
        private readonly grantRepo: IGrantRepository,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly calendarRepo: ICalendarRepository,
        private readonly projectRepo: IProjectRepository,
    ) {
    }

    async create(dto: CreateCallDTO) {
        const { grant, budget, deadlines } = dto;

        // 1. Fetch parent grant & validate
        const grantDoc = await this.grantRepo.findById(grant);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.active) throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);

        // 2. Validate that deadlines exist on the DTO before checking length
        if (!deadlines || !Array.isArray(deadlines)) {
            throw new AppError(ERROR_CODES.DEADLINE_NOT_FOUND);
        }

        // 3. Count selection stages and enforce strict matching
        const countStages = await this.grantStageRepo.countStages(grant, StageCategory.selection);

        if (deadlines.length !== countStages) {
            throw new AppError(
                ERROR_CODES.INVALID_DEADLINES_COUNT,
                `The number of deadlines (${deadlines.length}) must match the number of selection stages (${countStages}).`
            );
        }

        for (const deadline of deadlines) {
            const grantStageDoc = await this.grantStageRepo.findById(deadline.grantStage);
            if(!grantStageDoc){
                throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            }
            const subDate = new Date(deadline.submission);
            const evalDate = new Date(deadline.evaluation);
            if (subDate >= evalDate) {
                throw new AppError(
                    ERROR_CODES.INVALID_DEADLINE_DATE,
                    "Submission date must be earlier than the evaluation date."
                );
            }
        }

        const calendarDoc = await this.calendarRepo.findById(dto.calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.active) throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);

        // 4. Calculate existing budgets allocated to other Calls
        const grantCalls = await this.repository.find({ grant });
        const totalCallsBudget = grantCalls.reduce((sum, c) => sum + (c.budget || 0), 0);

        // ==========================================
        // 5. FIXED BUDGET VALIDATION: Accounts for usedBudget //actualAllocationHeadroom
        // ==========================================
        const actualAllocationHeadroom = grantDoc.amount - (grantDoc.usedBudget || 0);

        if (totalCallsBudget + budget > actualAllocationHeadroom) {
            const remaining = actualAllocationHeadroom - totalCallsBudget;
            //const maxAvailable = remaining > 0 ? remaining : 0;
            throw new AppError(
                ERROR_CODES.CALL_BUDGET_EXCEEDS_ALLOCATION,
                `Call budget exceeds remaining grant allocation headroom. Max available: ${remaining}`
            );
        }

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

        // Validate only if budget is changing
        if (data.budget !== undefined && data.budget !== callDoc.budget) {
            // Cannot reduce below already used budget
            if (data.budget < (callDoc.usedBudget || 0)) {
                throw new AppError(
                    ERROR_CODES.INVALID_GRANT_REDUCTION,
                    `Cannot reduce budget below used budget of ${callDoc.usedBudget}.`
                );
            }
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

            if (callDoc.usedBudget > 0) {
                throw new AppError(
                    ERROR_CODES.CALL_IN_USE,
                    'This call is already being used.'
                );
            }

            if (await this.projectRepo.exists({ call: id })) {
                throw new AppError(
                    ERROR_CODES.CALL_IN_USE,
                    'This call is already being used by projects.'
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

