import mongoose from "mongoose";
import { CreateCallDTO, ExistsCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { Call, ICall } from "./call.model";
import { CallStatus } from "./call.status";
import { GrantAllocation } from "../grants/allocations/grant.allocation.model";

export interface ICallRepository {
    findById(id: string): Promise<ICall | null>;
    find(filters: GetCallsOptions): Promise<Partial<ICall>[]>;
    create(dto: CreateCallDTO): Promise<ICall>;
    update(id: string, data: UpdateCallDTO["data"]): Promise<ICall | null>;
    updateStatus(id: string, newStatus: CallStatus): Promise<ICall | null>;
    exists(filters: ExistsCallDTO): Promise<boolean>;
    delete(id: string): Promise<ICall | null>;
}

// MongoDB implementation
export class CallRepository implements ICallRepository {

    async findById(id: string) {
        return Call.findById(new mongoose.Types.ObjectId(id))
            .lean<ICall>()
            .exec();
    }

    async find(filters: GetCallsOptions) {
        const query: any = {};

        // 1. Handle Status
        if (filters.status) {
            query.status = filters.status;
        }

        // 2. Handle Filtering by GrantAllocation OR its children (Calendar/Grant)
        if (filters.grantAllocation) {
            // Direct match
            query.grantAllocation = new mongoose.Types.ObjectId(filters.grantAllocation);
        } else if (filters.calendar || filters.grant) {
            // Find all Allocation IDs that match the calendar or grant
            const allocationQuery: any = {};
            if (filters.calendar) allocationQuery.calendar = filters.calendar;
            if (filters.grant) allocationQuery.grant = filters.grant;

            const matchingAllocations = await GrantAllocation.find(allocationQuery).select('_id').lean();
            const allocationIds = matchingAllocations.map(a => a._id);

            // Tell the Call query: "Find calls where grantAllocation is one of these IDs"
            query.grantAllocation = { $in: allocationIds };
        }

        let dbQuery = Call.find(query);

        // 3. Deep Population (Same as your current logic)
        if (filters.populate) {
            dbQuery = dbQuery.populate({
                path: 'grantAllocation',
                populate: [
                    { path: 'grant' },
                    { path: 'calendar' }
                ]
            });
        }

        return dbQuery.lean<ICall[]>().exec();
    }

    async create(dto: CreateCallDTO) {
        return Call.create({
            ...dto,
            grantAllocation: new mongoose.Types.ObjectId(dto.grantAllocation),
        });
    }

    async update(id: string, dtoData: UpdateCallDTO["data"]): Promise<ICall | null> {
        const updateData: Partial<ICall> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.description) updateData.description = dtoData.description;

        return Call.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async updateStatus(id: string, newStatus: CallStatus) {
        return Call.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsCallDTO): Promise<boolean> {
        const query: any = {};
        const { grantAllocation } = filters;
        if (grantAllocation) {
            query.grantAllocation = new mongoose.Types.ObjectId(grantAllocation);
        }
        const result = await Call.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Call.findByIdAndDelete(id).exec();
    }
}