import mongoose from "mongoose";
import { Grant, GrantStatus, IGrant } from "./grant.model";
import {
    CreateGrantDTO,
    FilterGrantsDTO,
    UpdateGrantDTO
} from "./grant.dto";
import { FilterOptions } from "../../common/dtos/filter.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

export interface IGrantRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IGrant | null>;

    findOne(
        title: string,
        options?: FilterOptions
    ): Promise<IGrant | null>;

    find(
        filters?: FilterGrantsDTO,
        options?: FilterOptions
    ): Promise<IGrant[]>;

    create(
        dto: CreateGrantDTO
    ): Promise<IGrant>;

    update(
        id: string,
        data: UpdateGrantDTO["data"]
    ): Promise<IGrant | null>;

    updateStatus(
        id: string,
        newStatus: GrantStatus
    ): Promise<IGrant | null>;

    exists(
        filters: FilterGrantsDTO
    ): Promise<boolean>;

    delete(
        id: string
    ): Promise<IGrant | null>;

    // Budget Operations
    consumeBudget(
        grantId: string,
        amount: number
    ): Promise<IGrant>;

    reverseConsumedBudget(
        grantId: string,
        amount: number
    ): Promise<IGrant>;
}

export class GrantRepository implements IGrantRepository {

    /**
     * Build MongoDB filter from grant filters.
     */
    private buildFilter(
        filters: Partial<FilterGrantsDTO> = {}
    ): Record<string, any> {

        const query: Record<string, any> = {};

        if (filters.ids?.length) {
            query._id = {
                $in: filters.ids.map(
                    id => new mongoose.Types.ObjectId(id)
                )
            };
        }

        if (filters.organizationIds?.length) {
            query.organization = {
                $in: filters.organizationIds.map(
                    id => new mongoose.Types.ObjectId(id)
                )
            };
        } else if (filters.organization) {
            query.organization =
                new mongoose.Types.ObjectId(filters.organization);
        }

        if (filters.thematic) {
            query.thematic =
                new mongoose.Types.ObjectId(filters.thematic);
        }

        if (filters.fundingSource) {
            query.fundingSource = filters.fundingSource;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return query;
    }

    /**
     * Find grant by ID.
     */
    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IGrant | null> {

        let dbQuery = Grant.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (options?.populate) {
            dbQuery
                .populate("organization")
                .populate("thematic");
        }

        return dbQuery
            .lean<IGrant>()
            .exec();
    }

    /**
     * Find grant by title.
     */
    async findOne(
        title: string,
        options?: FilterOptions
    ): Promise<IGrant | null> {

        let dbQuery = Grant.findOne({ title });

        if (options?.populate) {
            dbQuery
                .populate("organization")
                .populate("thematic");
        }

        return dbQuery
            .lean<IGrant>()
            .exec();
    }

    /**
     * Find grants using filters.
     */
    async find(
        filters: FilterGrantsDTO = {},
        options?: FilterOptions
    ): Promise<IGrant[]> {

        const query = this.buildFilter(filters);

        let dbQuery = Grant.find(query);

        if (options?.populate) {
            dbQuery
                .populate("organization")
                .populate("thematic");
        }

        return dbQuery
            .lean<IGrant[]>()
            .exec();
    }

    /**
     * Create grant.
     */
    async create(
        dto: CreateGrantDTO
    ): Promise<IGrant> {

        const data: Partial<IGrant> = {
            fundingSource: dto.fundingSource,
            organization: new mongoose.Types.ObjectId(
                dto.organization
            ),
            title: dto.title,
            amount: dto.amount,
            constraint: dto.constraint ? new mongoose.Types.ObjectId(
                dto.constraint
            ) : undefined,
            thematic: new mongoose.Types.ObjectId(
                dto.thematic
            ),
            description: dto.description,
            status: dto.status
        };

        return Grant.create(data);
    }

    /**
     * Update grant.
     */
    async update(
        id: string,
        dtoData: UpdateGrantDTO["data"]
    ): Promise<IGrant | null> {

        const updateData: Partial<IGrant> = {};

        if (dtoData.title !== undefined) {
            updateData.title = dtoData.title;
        }

        if (dtoData.description !== undefined) {
            updateData.description = dtoData.description;
        }

        if (dtoData.constraint !== undefined) {
            updateData.constraint = new mongoose.Types.ObjectId(
                dtoData.constraint
            );
        }

        if (dtoData.amount !== undefined) {
            updateData.amount = dtoData.amount;
        }

        return Grant.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        )
            .lean<IGrant>()
            .exec();
    }

    /**
     * Update grant status.
     */
    async updateStatus(
        id: string,
        newStatus: GrantStatus
    ): Promise<IGrant | null> {

        return Grant.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        )
            .lean<IGrant>()
            .exec();
    }

    /**
     * Check if a grant exists.
     */
    async exists(
        filters: FilterGrantsDTO
    ): Promise<boolean> {

        const query = this.buildFilter(filters);

        const result = await Grant.exists(query).exec();

        return result !== null;
    }

    /**
     * Delete grant.
     */
    async delete(
        id: string
    ): Promise<IGrant | null> {

        return Grant.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        )
            .lean<IGrant>()
            .exec();
    }

    /**
     * Consume budget directly.
     *
     * Condition:
     * allocated amount - used budget >= requested amount
     */
    async consumeBudget(
        grantId: string,
        amount: number
    ): Promise<IGrant> {

        const updated = await Grant.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(grantId),
                $expr: {
                    $gte: [
                        {
                            $subtract: [
                                "$amount",
                                { $ifNull: ["$usedBudget", 0] }
                            ]
                        },
                        amount
                    ]
                }
            },
            {
                $inc: {
                    usedBudget: amount
                }
            },
            {
                new: true
            }
        )
            .lean<IGrant>()
            .exec();

        if (!updated) {
            throw new AppError(
                ERROR_CODES.BUDGET_EXCEEDED
            );
        }

        return updated;
    }

    /**
     * Reverse consumed budget.
     *
     * Condition:
     * used budget >= amount
     */
    async reverseConsumedBudget(
        grantId: string,
        amount: number
    ): Promise<IGrant> {

        const updated = await Grant.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(grantId),
                usedBudget: {
                    $gte: amount
                }
            },
            {
                $inc: {
                    usedBudget: -amount
                }
            },
            {
                new: true
            }
        )
            .lean<IGrant>()
            .exec();

        if (!updated) {
            throw new AppError(
                ERROR_CODES.INVALID_BUDGET_REVERSAL
            );
        }

        return updated;
    }
}
