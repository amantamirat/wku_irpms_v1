import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IGrantAllocationRepository } from "./grant.allocation.repository";
import { IGrantRepository } from "../grant.repository";
import { ICalendarRepository } from "../../calendar/calendar.repository";
import {
    CreateGrantAllocationDTO,
    GetGrantAllocationsDTO,
    UpdateGrantAllocationDTO
} from "./grant.allocation.dto";
import { GrantStatus } from "../grant.model";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AllocationStatus } from "./grant.allocation.model";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { CalendarStatus } from "../../calendar/calendar.model";
import { ICallRepository } from "../../calls/call.repository";
import { IProjectRepository } from "../../projects/project.repository";

export class GrantAllocationService {

    constructor(
        private readonly repository: IGrantAllocationRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly calendarRepo: ICalendarRepository,
        private readonly callRepo: ICallRepository,
        private readonly projectRepo: IProjectRepository,
    ) { }

    /**
     * Create a new allocation for a grant + calendar
     */

    async create(dto: CreateGrantAllocationDTO) {
        const { grant, calendar, allocatedAmount } = dto;

        const calendarDoc = await this.calendarRepo.findById(dto.calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.active) throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);


        const grantDoc = await this.grantRepo.findById(grant);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.active) throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);


        // 1. Unique constraint: One allocation per grant per calendar
        const exists = await this.repository.exists({ grant, calendar });
        if (exists) throw new AppError(ERROR_CODES.ALLOCATION_ALREADY_EXISTS);

        // 2. Calculation: Sum existing allocations
        const grantAllocations = await this.repository.find({ grant });
        const totalAllocated = grantAllocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0);

        // 3. Validation
        if (totalAllocated + allocatedAmount > grantDoc.amount) {
            const remaining = grantDoc.amount - totalAllocated;
            throw new AppError(
                ERROR_CODES.ALLOCATION_EXCEEDS_GRANT_AMOUNT,
                `Budget exceeds grant capacity. Max available: ${remaining}`
            );
        }

        return await this.repository.create(dto);
    }

    /**
     * Get allocations
     */
    async get(dto: GetGrantAllocationsDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Get allocation by ID
     */
    async getById(id: string) {
        const allocation = await this.repository.findById(id);
        if (!allocation) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);
        return allocation;
    }

    /**
     * Update allocation (only totalBudget)
     * */
    /**
 * Update allocation (considering usedBudget and sub-call budgets)
 * */
    async update(dto: UpdateGrantAllocationDTO) {
        const { id, data } = dto;

        // 1. Fetch the specific allocation we are changing
        const currentAllocation = await this.repository.findById(id);
        if (!currentAllocation) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);

        // Only perform budget checks if allocatedAmount is actually being changed
        if (data.allocatedAmount !== undefined && data.allocatedAmount !== currentAllocation.allocatedAmount) {

            // 2. Budget Floor Check (Can't go below what's already spent/distributed)
            if (data.allocatedAmount < (currentAllocation.usedBudget || 0)) {
                throw new AppError(
                    ERROR_CODES.INVALID_BUDGET_REDUCTION,
                    `Cannot reduce allocatedAmount below usedBudget of ${currentAllocation.usedBudget}.`
                );
            }

            // 3. NEW: Call Budget Floor Check (Can't go below what's committed to active strategic Calls)
            // Fetch all calls tied to this specific allocation
            const activeCalls = await this.callRepo.find({ grantAllocation: id });
            const totalCommittedToCalls = activeCalls.reduce((sum, c) => sum + (c.budget || 0), 0);

            if (data.allocatedAmount < totalCommittedToCalls) {
                throw new AppError(
                    ERROR_CODES.INVALID_BUDGET_REDUCTION,
                    `Cannot reduce allocation to ${data.allocatedAmount}. Strategic Calls already claim ${totalCommittedToCalls} of this footprint.`
                );
            }

            // 4. Grant Ceiling Check
            const grant = String(currentAllocation.grant);
            const grantDoc = await this.grantRepo.findById(grant);
            if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);

            // Fetch ALL allocations for this grant (including the one we're updating)
            const grantAllocations = await this.repository.find({ grant });

            // Calculate current total across the whole grant
            const currentTotalSum = grantAllocations.reduce((sum, a) => sum + (a.allocatedAmount || 0), 0);

            /**
             * Projected total = current total - old allocation + new allocation
             */
            const projectedTotal = currentTotalSum - currentAllocation.allocatedAmount + data.allocatedAmount;

            if (projectedTotal > grantDoc.amount) {
                const remaining = grantDoc.amount - (currentTotalSum - currentAllocation.allocatedAmount);
                throw new AppError(
                    ERROR_CODES.ALLOCATION_EXCEEDS_GRANT_AMOUNT,
                    `Cannot update allocation to ${data.allocatedAmount}. Only ${remaining} remaining for this grant.`
                );
            }
        }

        return await this.repository.update(id, data);
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const allocationDoc = await this.repository.findById(id);
        if (!allocationDoc) {
            throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);
        }

        const from = allocationDoc.status as AllocationStatus;
        const to = next as AllocationStatus;
        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            ALLOCATION_TRANSITIONS
        );

        if (next === AllocationStatus.planned) {
            //what about used
            if (await this.callRepo.exists({ grantAllocation: id })) {
                throw new AppError(
                    ERROR_CODES.ALLOCATION_IN_USE,
                    'This allocation cannot be set to planned because it is already linked to a call.'
                );
            }
            if (await this.projectRepo.exists({ grantAllocation: id })) {
                throw new AppError(
                    ERROR_CODES.ALLOCATION_IN_USE,
                    'This allocation cannot be set to planned because it is already linked to a research project.'
                );
            }
        }
        if (next === GrantStatus.active) {

        }
        return await this.repository.updateStatus(id, to);
    }

    /**
     * Delete allocation (cannot delete if usedBudget > 0)
     */
    async delete(id: string) {
        const allocation = await this.repository.findById(id);
        if (!allocation) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);
        if (allocation.status !== AllocationStatus.planned)
            throw new AppError(ERROR_CODES.ALLOCATION_NOT_PLANNED);

        if ((allocation.usedBudget || 0) > 0) {
            throw new AppError(ERROR_CODES.ALLOCATION_IN_USE);
        }

        return await this.repository.delete(id);
    }



}

export const ALLOCATION_TRANSITIONS: Record<AllocationStatus, AllocationStatus[]> = {
    [AllocationStatus.planned]: [AllocationStatus.active],
    [AllocationStatus.active]: [AllocationStatus.closed, AllocationStatus.planned],
    [AllocationStatus.closed]: [AllocationStatus.active]
};
