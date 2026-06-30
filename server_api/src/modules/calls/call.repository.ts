import mongoose from "mongoose";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CreateCallDTO, ExistsCallDTO, GetCallsOptions, UpdateCallDTO } from "./call.dto";
import { Call, CallStatus, ICall } from "./call.model";

export interface ICallRepository {
    findById(id: string, populate?: boolean): Promise<ICall | null>;
    find(filters: GetCallsOptions): Promise<Partial<ICall>[]>;
    create(dto: CreateCallDTO): Promise<ICall>;
    update(id: string, data: UpdateCallDTO["data"]): Promise<ICall | null>;
    updateStatus(id: string, newStatus: CallStatus): Promise<ICall | null>;
    exists(filters: ExistsCallDTO): Promise<boolean>;
    delete(id: string): Promise<ICall | null>;
    //Local Budget Operations
    consumeBudget(callId: string, amount: number): Promise<ICall>;
    reverseConsumedBudget(callId: string, amount: number): Promise<ICall>;
}

// MongoDB implementation
export class CallRepository implements ICallRepository {

    async findById(id: string, populate?: boolean) {
        let dbQuery = Call.findById(new mongoose.Types.ObjectId(id));
        if (populate) {
            dbQuery = dbQuery.populate("grant");
            dbQuery = dbQuery.populate("calendar");
            dbQuery = dbQuery.populate("organization");
        }
        return dbQuery.lean<ICall>().exec();
    }

    async find(filters: GetCallsOptions) {
        const query: any = {};

        // 1. Handle Status
        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.grant) {
            query.grant = filters.grant;
        }

        if (filters.calendar) {
            query.calendar = filters.calendar;
        }


        let dbQuery = Call.find(query);

        // 3. Deep Population (Same as your current logic)
        if (filters.populate) {
            dbQuery = dbQuery.populate("grant");
            dbQuery = dbQuery.populate("calendar");
            dbQuery = dbQuery.populate("organization");
            dbQuery = dbQuery.populate({
                path: "deadlines.grantStage"
            });
        }

        return dbQuery.lean<ICall[]>().exec();
    }

    async create(dto: CreateCallDTO) {
        return Call.create({
            ...dto,
            grant: new mongoose.Types.ObjectId(dto.grant),
            calendar: new mongoose.Types.ObjectId(dto.calendar),
            organization: new mongoose.Types.ObjectId(dto.organization),
        });
    }

    async update(id: string, dtoData: UpdateCallDTO["data"]): Promise<ICall | null> {
        const updateData: Partial<ICall> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.description) updateData.description = dtoData.description;
        if (dtoData.budget) updateData.budget = dtoData.budget;

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
        const { grant, calendar } = filters;
        if (grant) {
            query.grant = new mongoose.Types.ObjectId(grant);
        }
        if (calendar) {
            query.calendar = new mongoose.Types.ObjectId(calendar);
        }
        const result = await Call.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Call.findByIdAndDelete(id).exec();
    }
    /**
             * Consume budget directly.
             * * Condition: allocatedAmount - usedBudget >= amount
        */
    async consumeBudget(callId: string, amount: number) {
        const updated = await Call.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(callId),
                $expr: {
                    $gte: [
                        {
                            $subtract: [
                                "$budget",
                                { $ifNull: ["$usedBudget", 0] }
                            ]
                        },
                        amount
                    ]
                }
            },
            {
                $inc: { usedBudget: amount }
            },
            { new: true }
        );

        if (!updated)
            throw new AppError(ERROR_CODES.BUDGET_EXCEEDED);

        return updated;
    }

    /**
     * Reverse consumed budget.
     * * Condition: usedBudget >= amount
     */
    async reverseConsumedBudget(callId: string, amount: number) {
        const updated = await Call.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(callId),
                usedBudget: { $gte: amount }
            },
            {
                $inc: { usedBudget: -amount }
            },
            { new: true }
        );

        if (!updated)
            throw new AppError(ERROR_CODES.INVALID_BUDGET_REVERSAL);

        return updated;
    }
}