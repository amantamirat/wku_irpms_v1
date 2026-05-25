import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { AllocationStatus } from "../grants/allocations/grant.allocation.model";
import { IGrantAllocationRepository } from "../grants/allocations/grant.allocation.repository";
import { GrantStatus, IGrant } from "../grants/grant.model";
import { IGrantStageRepository } from "../grants/stages/grant.stage.repository";
import { CreateCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { CallStatus } from "./call.model";
import { CallRepository } from "./call.repository";
import { CallStageStatus } from "./stages/call.stage.model";
import { ICallStageRepository } from "./stages/call.stage.repository";

export class CallService {

    constructor(
        private readonly repository: CallRepository,
        private readonly allocationRepo: IGrantAllocationRepository,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly callStageRepo: ICallStageRepository,
    ) {
    }

    async create(dto: CreateCallDTO) {
        const { grantAllocation, budget } = dto;

        // 1. Fetch parent allocation & validate
        const allocDoc = await this.allocationRepo.findById(grantAllocation, true);
        if (!allocDoc) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);
        if (allocDoc.status !== AllocationStatus.active) throw new AppError(ERROR_CODES.ALLOCATION_NOT_ACTIVE);

        // 2. Extract and validate grant
        const grantDoc = allocDoc.grant as unknown as IGrant;
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.active) throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);

        // 3. Ensure grant stages exist
        const grantStages = (await this.grantStageRepo.find({ grant: String(grantDoc._id) }));
        if (grantStages.length === 0) throw new AppError(ERROR_CODES.EMPTY_GRANT_STAGES);

        // 4. Calculate existing budgets allocated to other Calls
        const allocCalls = await this.repository.find({ grantAllocation });
        const totalBudgetUsedByCalls = allocCalls.reduce((sum, c) => sum + (c.budget || 0), 0);

        // 5. BUDGET VALIDATION: Check against the parent Grant Allocation limit
        if (totalBudgetUsedByCalls + budget > allocDoc.allocatedAmount) {
            const remaining = allocDoc.allocatedAmount - totalBudgetUsedByCalls;
            throw new AppError(
                ERROR_CODES.CALL_BUDGET_EXCEEDS_ALLOCATION,
                `Call budget exceeds remaining grant allocation. Max available: ${remaining}`
            );
        }

        // 6. Create the Call
        const created = await this.repository.create({
            ...dto,
            organization: String(grantDoc.organization),
            status: CallStatus.planned
        });

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
            const allocDoc = await this.allocationRepo.findById(String(currentCall.grantAllocation));
            if (!allocDoc) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);

            // Fetch ALL calls under this allocation
            const allocCalls = await this.repository.find({ grantAllocation: String(currentCall.grantAllocation) });

            // Exclude the CURRENT call from the sum so we don't calculate against ourselves
            const totalBudgetUsedByOthers = allocCalls
                .filter(c => String(c._id) !== String(id))
                .reduce((sum, c) => sum + (c.budget || 0), 0);

            // Validate the new proposed budget against the remaining space
            if (totalBudgetUsedByOthers + data.budget > allocDoc.allocatedAmount) {
                const remaining = allocDoc.allocatedAmount - totalBudgetUsedByOthers;
                throw new AppError(
                    ERROR_CODES.CALL_BUDGET_EXCEEDS_ALLOCATION,
                    `Updated budget exceeds allocation capacity. Max available for this call: ${remaining}`
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

