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

    // 🔥 Atomic budget operations
    reserveBudget(allocationId: string, amount: number): Promise<IGrantAllocation>;
    releaseBudget(allocationId: string, amount: number): Promise<void>;
}

export class GrantAllocationRepository implements IGrantAllocationRepository {

    async findById(id: string, populate?: boolean) {
        let dbQuery = GrantAllocation.findById(new mongoose.Types.ObjectId(id));
        if (populate) dbQuery.populate("grant").populate("calendar");
        return dbQuery.lean<IGrantAllocation>()
            .exec();
    }

    async find(filters: GetGrantAllocationsDTO) {
        const query: any = {};
        if (filters.grant) query.grant = new mongoose.Types.ObjectId(filters.grant);
        if (filters.calendar) query.calendar = new mongoose.Types.ObjectId(filters.calendar);
        if (filters.status) query.status;
        let dbQuery = GrantAllocation.find(query);
        if (filters.populate) dbQuery.populate("grant").populate("calendar");

        return dbQuery.lean<IGrantAllocation[]>().exec();
    }

    async create(dto: CreateGrantAllocationDTO) {
        const data: Partial<IGrantAllocation> = {
            grant: new mongoose.Types.ObjectId(dto.grant),
            calendar: new mongoose.Types.ObjectId(dto.calendar),
            totalBudget: dto.totalBudget,
            usedBudget: 0
        };
        return GrantAllocation.create(data);
    }

    async update(id: string, dtoData: UpdateGrantAllocationDTO["data"]) {
        const updateData: Partial<IGrantAllocation> = {};
        if (dtoData.totalBudget !== undefined) updateData.totalBudget = dtoData.totalBudget;

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
        if (filters.grant) query.grant = new mongoose.Types.ObjectId(filters.grant);
        if (filters.calendar) query.calendar = new mongoose.Types.ObjectId(filters.calendar);
        if (filters.status) query.status;
        const result = await GrantAllocation.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return GrantAllocation.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }



    /**
     * Reserve budget (atomic increment)
     */
    async reserveBudget(allocationId: string, amount: number) {
        const updated = await GrantAllocation.findOneAndUpdate(
            {
                _id: allocationId,
                $expr: {
                    $lte: [{ $add: ["$usedBudget", amount] }, "$totalBudget"]
                }
            },
            { $inc: { usedBudget: amount } },
            { new: true }
        );

        if (!updated) throw new AppError(ERROR_CODES.BUDGET_EXCEEDED);
        return updated;
    }

    /**
     * Release budget (atomic decrement)
     */
    async releaseBudget(allocationId: string, amount: number) {
        await GrantAllocation.findByIdAndUpdate(
            allocationId,
            { $inc: { usedBudget: -amount } }
        );
    }
}