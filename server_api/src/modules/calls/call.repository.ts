import mongoose from "mongoose";
import {
    CreateCallDTO,
    FilterCallDTO,
    UpdateCallDTO
} from "./call.dto";
import { Call, CallStatus, ICall } from "./call.model";
import { FilterOptions } from "../../common/dtos/filter.dto";

export interface ICallRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<ICall | null>;

    find(
        filters?: FilterCallDTO,
        options?: FilterOptions
    ): Promise<ICall[]>;

    create(dto: Omit<CreateCallDTO, "stages">): Promise<ICall>;

    update(
        id: string,
        data: UpdateCallDTO["data"]
    ): Promise<ICall | null>;

    updateStatus(
        id: string,
        newStatus: CallStatus
    ): Promise<ICall | null>;

    exists(
        filters: FilterCallDTO
    ): Promise<boolean>;

    delete(
        id: string
    ): Promise<ICall | null>;
}

export class CallRepository implements ICallRepository {

    /**
     * Build MongoDB filter from call filters.
     */
    private buildFilter(
        filters: Partial<FilterCallDTO> = {}
    ): Record<string, any> {

        const query: Record<string, any> = {};

        if (filters.calendar) {
            query.calendar = new mongoose.Types.ObjectId(
                filters.calendar
            );
        }

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(
                filters.grant
            );
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return query;
    }

    /**
     * Find call by ID.
     */
    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<ICall | null> {

        let dbQuery = Call.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (options?.populate) {
            dbQuery
                .populate("grant")
                .populate("calendar")
                .populate("organization");
        }

        return dbQuery
            .lean<ICall>()
            .exec();
    }

    /**
     * Find calls using filters.
     */
    async find(
        filters: FilterCallDTO = {},
        options?: FilterOptions
    ): Promise<ICall[]> {

        const query = this.buildFilter(filters);

        let dbQuery = Call.find(query);

        if (options?.populate) {
            dbQuery
                .populate("grant")
                .populate("calendar")
                .populate("organization");
        }

        return dbQuery
            .lean<ICall[]>()
            .exec();
    }

    /**
     * Create call.
     */
    async create(
        dto: CreateCallDTO
    ): Promise<ICall> {

        return Call.create({
            ...dto,
            grant: new mongoose.Types.ObjectId(dto.grant),
            calendar: new mongoose.Types.ObjectId(dto.calendar),
            organization: new mongoose.Types.ObjectId(
                dto.organization
            ),
            constraint: dto.constraint
                ? new mongoose.Types.ObjectId(dto.constraint)
                : undefined,
            composition: dto.composition
                ? new mongoose.Types.ObjectId(dto.composition)
                : undefined
        });
    }

    /**
     * Update call.
     */
    async update(
        id: string,
        dtoData: UpdateCallDTO["data"]
    ): Promise<ICall | null> {

        const updateData: Partial<ICall> = {};

        if (dtoData.title !== undefined) {
            updateData.title = dtoData.title;
        }

        if (dtoData.description !== undefined) {
            updateData.description = dtoData.description;
        }

        if (dtoData.deadline !== undefined) {
            updateData.deadline = dtoData.deadline;
        }

        if (dtoData.constraint !== undefined) {
            updateData.constraint = dtoData.constraint
                ? new mongoose.Types.ObjectId(dtoData.constraint)
                : undefined;
        }

        if (dtoData.composition !== undefined) {
            updateData.composition = dtoData.composition
                ? new mongoose.Types.ObjectId(dtoData.composition)
                : undefined;
        }

        return Call.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        )
            .lean<ICall>()
            .exec();
    }

    /**
     * Update call status.
     */
    async updateStatus(
        id: string,
        newStatus: CallStatus
    ): Promise<ICall | null> {

        return Call.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        )
            .lean<ICall>()
            .exec();
    }

    /**
     * Check if a call exists.
     */
    async exists(
        filters: FilterCallDTO
    ): Promise<boolean> {

        const query = this.buildFilter(filters);

        const result = await Call.exists(query).exec();

        return result !== null;
    }

    /**
     * Delete call.
     */
    async delete(
        id: string
    ): Promise<ICall | null> {

        return Call.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        )
            .lean<ICall>()
            .exec();
    }
}
