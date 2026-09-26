import mongoose from "mongoose";

import {
    CreateApplicationDTO,
    FilterApplicationDTO
} from "./application.dto";

import {
    ApplicationStatus,
    IApplication,
    Application,
    AnonymizationStatus
} from "./application.model";

import { FilterOptions } from "../../../common/dtos/filter.dto";
import { ScopeFilter } from "../../auth/auth.types";
import { toObjectId } from "../../../common/utils/mongoose.utils";



export interface UpdateApplicationData {
    status: ApplicationStatus;//ApplicationStatus.shortlisted | ApplicationStatus.accepted | ApplicationStatus.rejected;
    totalScore: number | null;
    anonymizedDocumentPath: string;
    anonymizationStatus: AnonymizationStatus;
    reviewerAssigner: string | null;
}


export interface IApplicationRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IApplication | null>;

    findOne(
        filters?: FilterApplicationDTO,
        options?: FilterOptions
    ): Promise<IApplication | null>;

    find(
        filters?: FilterApplicationDTO,
        options?: FilterOptions,
        scopeFilter?: ScopeFilter
    ): Promise<IApplication[]>;

    create(
        dto: CreateApplicationDTO,
        userId: string
    ): Promise<IApplication>;

    update(
        id: string,
        data: Partial<UpdateApplicationData>,
        userId?: string
    ): Promise<IApplication | null>;

    updateStatus(
        id: string,
        newStatus: ApplicationStatus,
        userId: string
    ): Promise<IApplication | null>;

    exists(
        filters: FilterApplicationDTO
    ): Promise<boolean>;

    delete(
        id: string
    ): Promise<IApplication | null>;
}


export class ApplicationRepository
    implements IApplicationRepository {

    /**
 * Build MongoDB filter from application filters.
 */
    private buildFilter(
        filters: FilterApplicationDTO = {}
    ): Record<string, any> {

        const query: Record<string, any> = {};

        if (filters.project) {
            query.project =
                toObjectId(filters.project);
        }

        if (filters.reviewerAssigner) {
            query.reviewerAssigner =
                toObjectId(filters.reviewerAssigner);
        }

        if (filters.projectIds?.length) {
            query.project = {
                $in: filters.projectIds.map(
                    id => toObjectId(id)
                )
            };
        }

        if (filters.stage) {
            query.stage =
                toObjectId(filters.stage);
        }

        if (filters.status) {
            query.status =
                filters.status;
        }

        return query;
    }

    /**
     * Find application by ID.
     */
    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IApplication | null> {

        let dbQuery =
            Application.findById(
                toObjectId(id)
            );

        if (options?.populate) {
            dbQuery
                .populate("project")
                .populate("stage");
        }

        return dbQuery
            .lean<IApplication>()
            .exec();
    }
    /**
     * Find a single application using filters.
     */
    async findOne(
        filters: FilterApplicationDTO = {},
        options?: FilterOptions
    ): Promise<IApplication | null> {

        const query =
            this.buildFilter(filters);

        let dbQuery =
            Application.findOne(query);

        if (options?.populate) {
            dbQuery
                .populate("project")
                .populate("stage");
        }

        return dbQuery
            .lean<IApplication>()
            .exec();
    }


    /**
     * Find applications using filters.
     */
    async find(
        filters: FilterApplicationDTO = {},
        options?: FilterOptions,
        scopeFilter?: ScopeFilter
    ): Promise<IApplication[]> {

        const filter =
            this.buildFilter(filters);

        const query = scopeFilter
            ? { $and: [scopeFilter, filter] }
            : filter;

        let dbQuery =
            Application.find(query);

        if (options?.populate) {
            dbQuery
                .populate("project")
                .populate("stage");
        }

        return dbQuery
            .lean<IApplication[]>()
            .exec();
    }


    /**
     * Create application.
     */
    async create(
        dto: CreateApplicationDTO,
        userId: string
    ): Promise<IApplication> {

        const data: Partial<IApplication> = {
            project:
                toObjectId(dto.project),

            stage:
                toObjectId(dto.stage),

            documentPath:
                dto.documentPath,

            createdBy:
                toObjectId(userId)
        };

        return Application.create(data);
    }


    /**
     * Update application.
     */
    async update(
        id: string,
        dtoData: Partial<UpdateApplicationData>,
        userId?: string
    ): Promise<IApplication | null> {

        const updateData: Partial<IApplication> = {};

        if (dtoData.reviewerAssigner !== undefined) {
            updateData.reviewerAssigner =
                dtoData.reviewerAssigner ? toObjectId(dtoData.reviewerAssigner) : null
        }

        if (dtoData.status !== undefined) {
            updateData.status =
                dtoData.status;
        }

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore =
                dtoData.totalScore;
        }

        if (
            dtoData.anonymizedDocumentPath !==
            undefined
        ) {
            updateData.anonymizedDocumentPath =
                dtoData.anonymizedDocumentPath;
        }

        if (
            dtoData.anonymizationStatus !==
            undefined
        ) {
            updateData.anonymizationStatus =
                dtoData.anonymizationStatus;
        }

        if (userId) {
            updateData.updatedBy =
                toObjectId(userId);
        }

        return Application.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: updateData
            },
            {
                new: true
            }
        )
            .lean<IApplication>()
            .exec();
    }


    /**
     * Update application status and status history.
     */
    async updateStatus(
        id: string,
        status: ApplicationStatus,
        userId: string
    ): Promise<IApplication | null> {

        return Application.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: {
                    status
                },
                $push: {
                    statusHistory: {
                        status,
                        changedBy:
                            toObjectId(userId),
                        changedAt: new Date()
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        )
            .lean<IApplication>()
            .exec();
    }


    /**
     * Check whether an application exists.
     */
    async exists(
        filters: FilterApplicationDTO
    ): Promise<boolean> {

        const query =
            this.buildFilter(filters);

        const result =
            await Application
                .exists(query)
                .exec();

        return result !== null;
    }


    /**
     * Delete application by ID.
     */
    async delete(
        id: string
    ): Promise<IApplication | null> {

        return Application.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        )
            .lean<IApplication>()
            .exec();
    }
}