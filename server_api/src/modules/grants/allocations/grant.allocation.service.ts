import mongoose from "mongoose";
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
import { ALLOCATION_TRANSITIONS, AllocationStatus } from "./grant.allocation.state-machine";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { CalendarStatus } from "../../calendar/calendar.state-machine";
import { ICallRepository } from "../../calls/call.repository";
import { IProjectRepository } from "../../projects/project.repository";

export class GrantAllocationService {

    constructor(
        private readonly repository: IGrantAllocationRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly calendarRepo: ICalendarRepository,
        private readonly callRepo: ICallRepository,
        private readonly projecrRepo: IProjectRepository,
    ) { }

    /**
     * Create a new allocation for a grant + calendar
     */

    async create(dto: CreateGrantAllocationDTO) {
        const { grant, calendar, totalBudget } = dto;

        const grantDoc = await this.grantRepo.findById(grant);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.active) throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);

        const calendarDoc = await this.calendarRepo.findById(dto.calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        if (calendarDoc.status !== CalendarStatus.active) throw new AppError(ERROR_CODES.CALENDAR_NOT_ACTIVE);


        // 1. Unique constraint: One allocation per grant per calendar
        const exists = await this.repository.exists({ grant, calendar });
        if (exists) throw new AppError(ERROR_CODES.ALLOCATION_ALREADY_EXISTS);

        // 2. Calculation: Sum existing allocations
        const currentAllocations = await this.repository.find({ grant });
        const totalAllocatedSoFar = currentAllocations.reduce((sum, a) => sum + (a.totalBudget || 0), 0);

        // 3. Validation
        if (totalAllocatedSoFar + totalBudget > grantDoc.amount) {
            const remaining = grantDoc.amount - totalAllocatedSoFar;
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
    async update(dto: UpdateGrantAllocationDTO) {
        const { id, data } = dto;

        // 1. Fetch the specific allocation we are changing
        const currentAllocation = await this.repository.findById(id);
        if (!currentAllocation) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);

        // 2. Budget Floor Check (Can't go below what's already spent)
        if (data.totalBudget !== undefined && data.totalBudget < (currentAllocation.usedBudget || 0)) {
            throw new AppError(
                ERROR_CODES.INVALID_BUDGET_REDUCTION,
                `Cannot reduce totalBudget below usedBudget of ${currentAllocation.usedBudget}.`
            );
        }

        // 3. Grant Ceiling Check
        if (data.totalBudget !== undefined && data.totalBudget !== currentAllocation.totalBudget) {

            const grant = String(currentAllocation.grant);
            const grantDoc = await this.grantRepo.findById(grant);
            if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);

            // Fetch ALL allocations for this grant (including the one we're updating)
            const allAllocations = await this.repository.find({ grant });

            // Calculate current total across the whole grant
            const currentTotalSum = allAllocations.reduce((sum, a) => sum + (a.totalBudget || 0), 0);

            /**
             * Projected total = current total - old allocation + new allocation
             */
            const projectedTotal = currentTotalSum - currentAllocation.totalBudget + data.totalBudget;

            if (projectedTotal > grantDoc.amount) {
                const remaining = grantDoc.amount - (currentTotalSum - currentAllocation.totalBudget);
                throw new AppError(
                    ERROR_CODES.ALLOCATION_EXCEEDS_GRANT_AMOUNT,
                    `Cannot update allocation to ${data.totalBudget}. Only ${remaining} remaining for this grant.`
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
            if (await this.callRepo.exists({ grantAllocation: id })) {
                throw new AppError(ERROR_CODES.CALL_ALREADY_EXISTS);
            }
            if (await this.projecrRepo.exists({ grantAllocation: id })) {
                throw new AppError(ERROR_CODES.PROJECT_ALREADY_EXISTS);
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

    /**
     * Check if there is enough remaining budget
     */
    async checkBudget(allocationId: string, amount: number) {
        const allocation = await this.repository.findById(allocationId);
        if (!allocation) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);

        const remaining = allocation.totalBudget - (allocation.usedBudget || 0);
        if (amount > remaining) throw new AppError(ERROR_CODES.BUDGET_EXCEEDED);

        return true;
    }

}