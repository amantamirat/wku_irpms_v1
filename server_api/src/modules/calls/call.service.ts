import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { CalendarStatus } from "../calendar/calendar.model";
import { CalendarRepository, ICalendarRepository } from "../calendar/calendar.repository";
import { AllocationStatus } from "../grants/allocations/grant.allocation.model";
import { IGrantAllocationRepository } from "../grants/allocations/grant.allocation.repository";
import { GrantStatus, IGrant } from "../grants/grant.model";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { StageCategory } from "../grants/stages/grant.stage.model";
import { IGrantStageRepository } from "../grants/stages/grant.stage.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallStatus } from "./call.model";
import { CallRepository, ICallRepository } from "./call.repository";
import { CallStageStatus } from "./stages/call.stage.model";
import { ICallStageRepository } from "./stages/call.stage.repository";

export class CallService {

    constructor(
        private readonly repository: CallRepository,
        private readonly allocationRepo: IGrantAllocationRepository,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly callStageRepo: ICallStageRepository,
        private readonly grantRepo: IGrantRepository = new GrantRepository(),
        private readonly calendarRepo: ICalendarRepository = new CalendarRepository(),
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
            throw new AppError(ERROR_CODES.DEADLINES_REQUIRED);
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
            const subDate = new Date(deadline.submission);
            const evalDate = new Date(deadline.evaluation);
            if (subDate >= evalDate) {
                throw new AppError(
                    ERROR_CODES.INVALID_DEADLINE_DATES,
                    "Submission date must be earlier than the evaluation date."
                );
            }
        }

        const calendarDoc = await this.calendarRepo.findById(dto.calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.active) throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);

        // 4. Calculate existing budgets allocated to other Calls
        const grantCalls = await this.repository.find({ grant });
        const totalBudgetUsedByCalls = grantCalls.reduce((sum, c) => sum + (c.budget || 0), 0);

        // ==========================================
        // 5. FIXED BUDGET VALIDATION: Accounts for usedBudget
        // ==========================================
        const actualAllocationHeadroom = grantDoc.amount - (grantDoc.usedBudget || 0);

        if (totalBudgetUsedByCalls + budget > actualAllocationHeadroom) {
            const remaining = actualAllocationHeadroom - totalBudgetUsedByCalls;
            const maxAvailable = remaining > 0 ? remaining : 0;
            throw new AppError(
                ERROR_CODES.CALL_BUDGET_EXCEEDS_ALLOCATION,
                `Call budget exceeds remaining grant allocation headroom. Max available: ${maxAvailable}`
            );
        }










        // 6. Create the Call
        const created = await this.repository.create({
            ...dto,
            organization: String(grantDoc.organization),
            status: CallStatus.planned
        });

        /*
        // 7. Generate Call Stages with incremental deadlines
        const callStagesPayload = grantStages.map(gs => {
            // Fix: Use a clean baseline date for each map iteration 
            // so it scales sequentially based strictly on the order index.
            const deadlineDate = new Date();
            deadlineDate.setDate(deadlineDate.getDate() + (gs.order * 7));

            return {
                call: String(created._id),
                grantStage: gs._id,
                order: gs.order,
                deadline: deadlineDate
            };
        });

        await this.callStageRepo.createMany(callStagesPayload);
*/
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

        // 1. Fetch the existing Call first so we know its context
        const currentCall = await this.repository.findById(id);
        if (!currentCall) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

        // 2. ONLY run budget validation if the user is actually trying to change the budget
        if (data.budget !== undefined && data.budget !== currentCall.budget) {

            // Fetch the parent allocation ceiling
            const allocDoc = await this.allocationRepo.findById(String(currentCall.grant));
            if (!allocDoc) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);

            // Fetch ALL calls under this allocation
            const allocCalls = await this.repository.find({ grant: String(currentCall.grant) });

            // Exclude the CURRENT call from the sum so we don't calculate against ourselves
            const totalBudgetUsedByOthers = allocCalls
                .filter(c => String(c._id) !== String(id))
                .reduce((sum, c) => sum + (c.budget || 0), 0);

            // Calculate the actual available headroom left inside the grant allocation pool
            const actualAllocationHeadroom = allocDoc.allocatedAmount - (allocDoc.usedBudget || 0);

            // Validate the new proposed budget against the remaining space
            if (totalBudgetUsedByOthers + data.budget > actualAllocationHeadroom) {
                const remaining = actualAllocationHeadroom - totalBudgetUsedByOthers;

                // Fallback to 0 if the math drops below zero due to dynamic changes elsewhere
                const maxAvailableForThisCall = remaining > 0 ? remaining : 0;

                throw new AppError(
                    ERROR_CODES.CALL_BUDGET_EXCEEDS_ALLOCATION,
                    `Updated budget exceeds allocation capacity. Max available for this call: ${maxAvailableForThisCall}`
                );
            }
        }
        // 3. Save the updates safely
        const updated = await this.repository.update(id, data);
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
export const CALL_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
    [CallStatus.planned]: [CallStatus.active],
    [CallStatus.active]: [CallStatus.closed, CallStatus.planned],
    [CallStatus.closed]: [CallStatus.active]
};

