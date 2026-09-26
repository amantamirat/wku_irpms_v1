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
import { toObjectId } from "../../common/utils/mongoose.utils";

export interface CreateReviewerData {
    targetType: ReviewerTargetType;
    reviewer: string;
    project: string;
    application?: string;
    verification?: string;
    evaluation: string;
    weight: number;
    createdBy: string;
}

export interface IReviewerRepository {
    create(data: CreateReviewerData): Promise<IReviewer>;

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

    count(filters?: FilterReviewersDto): Promise<number>;

    update(
        id: string,
        data: Partial<IReviewer>
    ): Promise<IReviewer | null>;

    exists(filters: FilterReviewersDto): Promise<boolean>;

    updateStatus(
        id: string,
        status: ReviewerStatus,
        changedBy: string
    ): Promise<IReviewer | null>;

    delete(id: string): Promise<IReviewer | null>;
}

export class ReviewerRepository implements IReviewerRepository {

    private buildFilter(
        filters: FilterReviewersDto = {}
    ): Record<string, any> {
        return {
            ...(filters.application && {
                application: toObjectId(filters.application)
            }),
            ...(filters.verification && {
                verification: toObjectId(filters.verification)
            }),
            ...(filters.reviewer && {
                reviewer: toObjectId(filters.reviewer)
            }),
            ...(filters.project && {
                project: toObjectId(filters.project)
            }),
            ...(filters.status && {
                status: filters.status
            })
        };
    }

    async create(
        data: CreateReviewerData
    ): Promise<IReviewer> {

        const reviewer = await Reviewer.create({
            targetType: data.targetType,
            reviewer: toObjectId(data.reviewer),
            project: toObjectId(data.project),

            ...(data.application && {
                application: toObjectId(data.application)
            }),

            ...(data.verification && {
                verification: toObjectId(data.verification)
            }),

            evaluation: toObjectId(data.evaluation),
            weight: data.weight,

            createdBy: toObjectId(data.createdBy),
            updatedBy: toObjectId(data.createdBy)
        });

        return reviewer.toObject() as IReviewer;
    }

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IReviewer | null> {

        const query = Reviewer.findById(toObjectId(id));

        if (options?.populate) {
            query
                .populate("reviewer")
                .populate("project")
                .populate("application")
                .populate("verification")
                .populate("evaluation")
                .populate("createdBy")
                .populate("updatedBy");
        }

        return query.lean<IReviewer>().exec();
    }

    async findOne(
        filters: FilterReviewersDto = {},
        options?: FilterOptions
    ): Promise<IReviewer | null> {

        const query = Reviewer.findOne(
            this.buildFilter(filters)
        );

        if (options?.populate) {
            query
                .populate("reviewer")
                .populate("project")
                .populate("application")
                .populate("verification")
                .populate("evaluation")
                .populate("createdBy")
                .populate("updatedBy");
        }

        return query.lean<IReviewer>().exec();
    }

    async find(
        filters: FilterReviewersDto = {},
        options?: FilterOptions,
        scopeFilter?: ScopeFilter
    ): Promise<IReviewer[]> {

        const filter = this.buildFilter(filters);

        const query = scopeFilter
            ? { $and: [scopeFilter, filter] }
            : filter;

        const dbQuery = Reviewer
            .find(query)
            .sort({ createdAt: -1 });

        if (options?.populate) {
            dbQuery
                .populate("reviewer")
                .populate("project")
                .populate({
                    path: "application",
                    populate: { path: "stage" }
                })
                .populate("verification")
                .populate("evaluation")
                .populate("createdBy")
                .populate("updatedBy");
        }

        return dbQuery.lean<IReviewer[]>().exec();
    }

    async count(
        filters: FilterReviewersDto = {}
    ): Promise<number> {
        return Reviewer
            .countDocuments(this.buildFilter(filters))
            .exec();
    }

    async update(
        id: string,
        data: Partial<IReviewer>
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndUpdate(
            toObjectId(id),
            { $set: data },
            {
                new: true,
                runValidators: true
            }
        )
            .lean<IReviewer>()
            .exec();
    }

    async exists(
        filters: FilterReviewersDto
    ): Promise<boolean> {

        const filter = this.buildFilter(filters);

        if (!Object.keys(filter).length) {
            return false;
        }

        return !!await Reviewer.exists(filter);
    }

    async updateStatus(
        id: string,
        status: ReviewerStatus,
        changedBy: string
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndUpdate(
            toObjectId(id),
            {
                $set: {
                    status,
                    updatedBy: toObjectId(changedBy)
                },
                $push: {
                    statusHistory: {
                        status,
                        changedBy: toObjectId(changedBy),
                        changedAt: new Date()
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

    async delete(
        id: string
    ): Promise<IReviewer | null> {

        return Reviewer.findByIdAndDelete(
            toObjectId(id)
        )
            .lean<IReviewer>()
            .exec();
    }
}