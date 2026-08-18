// application.repository.ts

import mongoose, { HydratedDocument } from "mongoose";
import {
    CreateApplicationDTO,
    ExistsApplicationDTO,
    FindByIdOptions,
    GetApplicationDTO,
    UpdateApplicationDTO
} from "./application.dto";
import {
    ApplicationStatus,
    IApplication,
    Application
} from "./application.model";

export interface IApplicationRepository {

    findById(
        id: string,
        options?: FindByIdOptions
    ): Promise<IApplication | null>;

    find(
        filters: GetApplicationDTO
    ): Promise<IApplication[]>;

    /*
    findOneByProjectAndStage(
        projectId: string,
        grantStageId?: string,
        callStageId?: string
    ): Promise<IApplication | null>;*/

    findLatestByProject(
        projectId: string
    ): Promise<IApplication | null>;

    create(
        dto: CreateApplicationDTO
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
        filters: ExistsApplicationDTO
    ): Promise<boolean>;

    delete(
        id: string
    ): Promise<IApplication | null>;
}


// MongoDB implementation
export class ApplicationRepository
    implements IApplicationRepository {

    async findById(
        id: string,
        options?: FindByIdOptions
    ): Promise<IApplication | null> {

        let dbQuery = Application.findById(
            new mongoose.Types.ObjectId(id)
        );

        const populate = options?.populate;

        if (populate?.project) {
            dbQuery = dbQuery.populate("project");
        }

        if (populate?.stage) {
            dbQuery = dbQuery.populate("stage");
        }

        return dbQuery
            .lean<IApplication>()
            .exec();
    }


    async find(
        options: GetApplicationDTO
    ): Promise<IApplication[]> {

        const query: any = {};

        // Direct filters
        if (options.project) {
            query.project =
                new mongoose.Types.ObjectId(options.project);
        }

        if (options.stage) {
            query.stage =
                new mongoose.Types.ObjectId(options.stage);
        }

        if (options.status) {
            query.status = options.status;
        }

        const dbQuery = Application.find(query);

        // Populate
        if (options.populate) {
            dbQuery
                .populate("project")
                .populate("stage");
        }

        return dbQuery
            .lean<IApplication[]>()
            .exec();
    }

    /*
    async findOneByProjectAndStage(
        projectId: string,
        stageId?: string,
        callStageId?: string
    ): Promise<IApplication | null> {

        const query: any = {
            project:
                new mongoose.Types.ObjectId(projectId)
        };

        if (stageId) {
            query.stage =
                new mongoose.Types.ObjectId(stageId);
        }

        if (callStageId) {
            query.callStage =
                new mongoose.Types.ObjectId(callStageId);
        }

        return Application.findOne(query)
            .lean<IApplication>()
            .exec();
    }*/
    async create(
        dto: CreateApplicationDTO
    ): Promise<IApplication> {

        const data: Partial<IApplication> = {
            project:
                new mongoose.Types.ObjectId(dto.project),

            stage:
                new mongoose.Types.ObjectId(dto.stage),

            documentPath:
                dto.documentPath
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
        filters: ExistsApplicationDTO
    ): Promise<boolean> {

        const query: any = {};

        const { stage, project } = filters;

        if (stage) {
            query.grantStage =
                new mongoose.Types.ObjectId(stage);
        }

        if (project) {
            query.project =
                new mongoose.Types.ObjectId(project);
        }

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