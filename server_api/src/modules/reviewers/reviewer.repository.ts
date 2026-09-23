import mongoose from "mongoose";

import {
    IReviewer,
    Reviewer,
    ReviewerTargetType
} from "./reviewer.model";

import { ReviewerStatus } from "./reviewer.state-machine";

import { FilterOptions } from "../../common/dtos/filter.dto";

import { FilterReviewersDto } from "./reviewer.dto";

import { ScopeFilter } from "../auth/auth.types";


export interface CreateReviewerData {
    targetType: ReviewerTargetType;

    reviewer: string;
    project: string;

    application?: string;
    verification?: string;

    evaluation: string;

    score?: number;
    weight?: number;

    status?: ReviewerStatus;
}


export interface IReviewerRepository {

    create(
        data: CreateReviewerData
    ): Promise<IReviewer>;

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IReviewer | null>;

    findOne(
        filters?: FilterReviewersDto,
        options?: FilterOptions
    ): Promise<IReviewer | null>;

    find(
        filters?: FilterReviewersDto,
        options?: FilterOptions,
        scopeFilter?: ScopeFilter
    ): Promise<IReviewer[]>;

    count(
        filters?: FilterReviewersDto
    ): Promise<number>;

    update(
        id: string,
        data: Partial<IReviewer>
    ): Promise<IReviewer | null>;

    exists(
        filters: FilterReviewersDto
    ): Promise<boolean>;

    updateStatus(
        id: string,
        status: ReviewerStatus,
        changedBy: string
    ): Promise<IReviewer | null>;

    delete(
        id: string
    ): Promise<IReviewer | null>;
}


export class ReviewerRepository
    implements IReviewerRepository {


    /**
     * Build MongoDB filter from reviewer filters.
     */
    private buildFilter(
        filters: FilterReviewersDto = {}
    ): Record<string, any> {

        const query: Record<string, any> = {};

        if (filters.application) {
            query.application =
                new mongoose.Types.ObjectId(
                    filters.application
                );
        }

        if (filters.verification) {
            query.verification =
                new mongoose.Types.ObjectId(
                    filters.verification
                );
        }

        if (filters.reviewer) {
            query.reviewer =
                new mongoose.Types.ObjectId(
                    filters.reviewer
                );
        }

        /*
        if (filters.project) {
            query.project =
                new mongoose.Types.ObjectId(
                    filters.project
                );
        }
        */

        if (filters.status) {
            query.status =
                filters.status;
        }

        /*
        if (filters.targetType) {
            query.targetType =
                filters.targetType;
        }
        */

        return query;
    }


    /**
     * Create reviewer.
     */
    async create(
        data: CreateReviewerData
    ): Promise<IReviewer> {

        const reviewer =
            await Reviewer.create({
                targetType:
                    data.targetType,

                reviewer:
                    new mongoose.Types.ObjectId(
                        data.reviewer
                    ),

                project:
                    new mongoose.Types.ObjectId(
                        data.project
                    ),

                application:
                    data.application
                        ? new mongoose.Types.ObjectId(
                            data.application
                        )
                        : undefined,

                verification:
                    data.verification
                        ? new mongoose.Types.ObjectId(
                            data.verification
                        )
                        : undefined,

                evaluation:
                    new mongoose.Types.ObjectId(
                        data.evaluation
                    ),

                score:
                    data.score,

                weight:
                    data.weight,

                status:
                    data.status
            });

        return reviewer.toObject() as IReviewer;
    }


    /**
     * Find reviewer by ID.
     */
    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IReviewer | null> {

        let dbQuery =
            Reviewer.findById(
                new mongoose.Types.ObjectId(id)
            );

        if (options?.populate) {
            dbQuery
                .populate("reviewer")
                .populate("project")
                .populate("application")
                .populate("verification");
        }

        return dbQuery
            .lean<IReviewer>()
            .exec();
    }


    /**
     * Find a single reviewer using filters.
     */
    async findOne(
        filters: FilterReviewersDto = {},
        options?: FilterOptions
    ): Promise<IReviewer | null> {

        const filter =
            this.buildFilter(filters);

        let dbQuery =
            Reviewer.findOne(filter);

        if (options?.populate) {
            dbQuery
                .populate("reviewer")
                .populate("project")
                .populate("application")
                .populate("verification");
        }

        return dbQuery
            .lean<IReviewer>()
            .exec();
    }


    /**
     * Find reviewers using filters.
     */
    async find(
        filters: FilterReviewersDto = {},
        options?: FilterOptions,
        scopeFilter?: ScopeFilter
    ): Promise<IReviewer[]> {

        const filter =
            this.buildFilter(filters);

        const query = scopeFilter
            ? {
                $and: [
                    scopeFilter,
                    filter
                ]
            }
            : filter;

        let dbQuery =
            Reviewer
                .find(query)
                .sort({
                    createdAt: -1
                });

        if (options?.populate) {
            dbQuery
                .populate("reviewer")
                .populate("project")
                .populate({
                    path: "application",
                    populate: {
                        path: "stage"
                    }
                })
                .populate("verification");
        }

        return dbQuery
            .lean<IReviewer[]>()
            .exec();
    }


    /**
     * Count reviewers using filters.
     */
    async count(
        filters: FilterReviewersDto = {}
    ): Promise<number> {

        const filter =
            this.buildFilter(filters);

        return Reviewer
            .countDocuments(filter)
            .exec();
    }


    /**
     * Update reviewer.
     */
    async update(
        id: string,
        data: Partial<IReviewer>
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: data
            },
            {
                new: true,
                runValidators: true
            }
        )
            .lean<IReviewer>()
            .exec();
    }


    /**
     * Check whether a reviewer exists.
     */
    async exists(
        filters: FilterReviewersDto
    ): Promise<boolean> {

        const filter =
            this.buildFilter(filters);

        if (!Object.keys(filter).length) {
            return false;
        }

        const result =
            await Reviewer
                .exists(filter)
                .exec();

        return result !== null;
    }


    /**
     * Update reviewer status and status history.
     */
    async updateStatus(
        id: string,
        status: ReviewerStatus,
        changedBy: string
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: {
                    status
                },

                $push: {
                    statusHistory: {
                        status,

                        changedBy:
                            new mongoose.Types.ObjectId(
                                changedBy
                            ),

                        changedAt:
                            new Date()
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        )
            .lean<IReviewer>()
            .exec();
    }


    /**
     * Delete reviewer by ID.
     */
    async delete(
        id: string
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        )
            .lean<IReviewer>()
            .exec();
    }
}