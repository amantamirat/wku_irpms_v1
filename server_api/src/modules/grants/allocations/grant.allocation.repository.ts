import mongoose from "mongoose";
import { GrantAllocation, IGrantAllocation } from "./grant.allocation.model";
import {
    CreateGrantAllocationDTO,
    ExistsGrantAllocationDTO,
    GetGrantAllocationsDTO,
    UpdateGrantAllocationDTO
} from "./grant.allocation.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { AllocationStatus } from "./grant.allocation.state-machine";

export interface IGrantAllocationRepository {
    findById(id: string, populate?: boolean): Promise<IGrantAllocation | null>;
    find(filters: GetGrantAllocationsDTO): Promise<Partial<IGrantAllocation>[]>;
    create(dto: CreateGrantAllocationDTO): Promise<IGrantAllocation>;
    update(id: string, data: UpdateGrantAllocationDTO["data"]): Promise<IGrantAllocation | null>;
    updateStatus(id: string, newStatus: AllocationStatus): Promise<IGrantAllocation | null>;
    exists(filters: ExistsGrantAllocationDTO): Promise<boolean>;
    delete(id: string): Promise<IGrantAllocation | null>;

    // Reservation operations
    reserveBudget(allocationId: string, amount: number): Promise<IGrantAllocation>;
    releaseReservedBudget(allocationId: string, amount: number): Promise<void>;

    // Actual usage operations
    consumeBudget(allocationId: string, amount: number): Promise<IGrantAllocation>;
    reverseConsumedBudget(allocationId: string, amount: number): Promise<IGrantAllocation>;
}

export class GrantAllocationRepository implements IGrantAllocationRepository {

    async findById(id: string, populate?: boolean) {
        let dbQuery = GrantAllocation.findById(new mongoose.Types.ObjectId(id));

        if (populate)
            dbQuery.populate("grant").populate("calendar");

        return dbQuery
            .lean<IGrantAllocation>()
            .exec();
    }

    async find(filters: GetGrantAllocationsDTO) {
        const query: any = {};

        if (filters.grant)
            query.grant = new mongoose.Types.ObjectId(filters.grant);

        if (filters.calendar)
            query.calendar = new mongoose.Types.ObjectId(filters.calendar);

        if (filters.status)
            query.status = filters.status;

        let dbQuery = GrantAllocation.find(query);

        if (filters.populate)
            dbQuery.populate("grant").populate("calendar");

        return dbQuery
            .lean<IGrantAllocation[]>()
            .exec();
    }

    async create(dto: CreateGrantAllocationDTO) {

        const data: Partial<IGrantAllocation> = {
            grant: new mongoose.Types.ObjectId(dto.grant),
            calendar: new mongoose.Types.ObjectId(dto.calendar),

            totalBudget: dto.totalBudget,

            reservedBudget: 0,
            usedBudget: 0
        };

        return GrantAllocation.create(data);
    }

    async update(id: string, dtoData: UpdateGrantAllocationDTO["data"]) {

        const updateData: Partial<IGrantAllocation> = {};

        if (dtoData.totalBudget !== undefined)
            updateData.totalBudget = dtoData.totalBudget;

        return GrantAllocation.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async updateStatus(id: string, newStatus: AllocationStatus) {

        return GrantAllocation.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsGrantAllocationDTO): Promise<boolean> {

        const query: any = {};

        if (filters.grant)
            query.grant = new mongoose.Types.ObjectId(filters.grant);

        if (filters.calendar)
            query.calendar = new mongoose.Types.ObjectId(filters.calendar);

        if (filters.status)
            query.status = filters.status;

        const result = await GrantAllocation.exists(query).exec();

        return result !== null;
    }

    async delete(id: string) {
        return GrantAllocation.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }

    /**
     * Reserve budget for granted projects
     *
     * Checks:
     * totalBudget - reservedBudget >= amount
     */
    async reserveBudget(allocationId: string, amount: number) {

        const updated = await GrantAllocation.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(allocationId),

                $expr: {
                    $gte: [
                        {
                            $subtract: [
                                "$totalBudget",
                                { $ifNull: ["$reservedBudget", 0] }
                            ]
                        },
                        amount
                    ]
                }
            },

            {
                $inc: {
                    reservedBudget: amount
                }
            },

            { new: true }
        );

        if (!updated)
            throw new AppError(ERROR_CODES.BUDGET_EXCEEDED);

        return updated;
    }

    /**
     * Release reserved budget
     *
     * Example:
     * project cancelled/rejected after granted
     */
    async releaseReservedBudget(
        allocationId: string,
        amount: number
    ) {

        await GrantAllocation.findByIdAndUpdate(
            new mongoose.Types.ObjectId(allocationId),

            {
                $inc: {
                    reservedBudget: -amount
                }
            }
        );
    }

    /**
     * Consume actual budget
     *
     * Usually called when:
     * phase becomes active/completed
     *
     * Moves money:
     * reserved -> used
     */
    async consumeBudget(
        allocationId: string,
        amount: number
    ) {

        const updated = await GrantAllocation.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(allocationId),

                reservedBudget: { $gte: amount }
            },

            {
                $inc: {
                    reservedBudget: -amount,
                    usedBudget: amount
                }
            },

            { new: true }
        );

        if (!updated)
            throw new AppError(ERROR_CODES.BUDGET_EXCEEDED);

        return updated;
    }

    async reverseConsumedBudget(
        allocationId: string,
        amount: number
    ) {

        const updated = await GrantAllocation.findOneAndUpdate(
            {
                _id: allocationId,
                usedBudget: { $gte: amount }
            },

            {
                $inc: {
                    usedBudget: -amount,
                    reservedBudget: amount
                }
            },

            { new: true }
        );

        if (!updated)
            throw new AppError(ERROR_CODES.INVALID_BUDGET_REVERSAL);

        return updated;
    }
}