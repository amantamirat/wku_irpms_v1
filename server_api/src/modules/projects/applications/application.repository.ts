// application.repository.ts

import mongoose from "mongoose";

import {
    CreateApplicationDTO,
    FilterApplicationDTO,
    UpdateApplicationDTO
} from "./application.dto";

import {
    ApplicationStatus,
    IApplication,
    Application
} from "./application.model";

import { FilterOptions } from "../../../common/dtos/filter.dto";


export interface IApplicationRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IApplication | null>;

    find(
        filters?: FilterApplicationDTO,
        options?: FilterOptions
    ): Promise<IApplication[]>;

    findLatestByProject(
        projectId: string
    ): Promise<IApplication | null>;

    create(
        dto: CreateApplicationDTO, userId: string
    ): Promise<IApplication>;

    update(
        id: string,
        data: UpdateApplicationDTO["data"]
    ): Promise<IApplication | null>;

    updateStatus(
        id: string,
        newStatus: ApplicationStatus
    ): Promise<IApplication | null>;

    countByProject(
        projectId: string
    ): Promise<number>;

    exists(
        filters: FilterApplicationDTO
    ): Promise<boolean>;

    delete(
        id: string
    ): Promise<IApplication | null>;
}


// MongoDB implementation
export class ApplicationRepository
    implements IApplicationRepository {

    /**
     * Build MongoDB filter from application filters
     */
    private buildFilter(
        filters: Partial<FilterApplicationDTO> = {}
    ): Record<string, any> {

        const query: Record<string, any> = {};

        if (filters.project) {
            query.project =
                new mongoose.Types.ObjectId(filters.project);
        }

        if (filters.stage) {
            query.stage =
                new mongoose.Types.ObjectId(filters.stage);
        }

        if (filters.status) {
            query.status =
                filters.status;
        }

        return query;
    }


    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IApplication | null> {

        let dbQuery = Application.findById(
            new mongoose.Types.ObjectId(id)
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


    async find(
        filters: FilterApplicationDTO = {},
        options?: FilterOptions
    ): Promise<IApplication[]> {

        const query = this.buildFilter(filters);

        let dbQuery = Application.find(query);

        if (options?.populate) {
            dbQuery
                .populate("project")
                .populate("stage");
        }

        return dbQuery
            .lean<IApplication[]>()
            .exec();
    }


    async create(
        dto: CreateApplicationDTO, userId: string
    ): Promise<IApplication> {

        const data: Partial<IApplication> = {
            project:
                new mongoose.Types.ObjectId(dto.project),

            stage:
                new mongoose.Types.ObjectId(dto.stage),

            documentPath:
                dto.documentPath,
            createdBy: new mongoose.Types.ObjectId(userId)
        };

        return Application.create(data);
    }


    async update(
        id: string,
        dtoData: UpdateApplicationDTO["data"]
    ): Promise<IApplication | null> {

        const updateData: Partial<IApplication> = {};

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore =
                dtoData.totalScore;
        }

        if (dtoData.anonymizedDocumentPath !== undefined) {
            updateData.anonymizedDocumentPath =
                dtoData.anonymizedDocumentPath;
        }

        if (dtoData.anonymizationStatus !== undefined) {
            updateData.anonymizationStatus =
                dtoData.anonymizationStatus;
        }

        return Application.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }


    async updateStatus(
        id: string,
        newStatus: ApplicationStatus
    ): Promise<IApplication | null> {

        return Application.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: {
                    status: newStatus
                }
            },
            { new: true }
        ).exec();
    }


    async countByProject(
        projectId: string
    ): Promise<number> {

        return Application.countDocuments({
            project:
                new mongoose.Types.ObjectId(projectId)
        }).exec();
    }


    async findLatestByProject(
        projectId: string
    ): Promise<IApplication | null> {

        return Application.findOne({
            project:
                new mongoose.Types.ObjectId(projectId)
        })
            .sort({ createdAt: -1 })
            .lean<IApplication>()
            .exec();
    }


    async exists(
        filters: FilterApplicationDTO
    ): Promise<boolean> {

        const query = this.buildFilter(filters);

        const result =
            await Application.exists(query).exec();

        return result !== null;
    }


    async delete(
        id: string
    ): Promise<IApplication | null> {

        return Application.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}