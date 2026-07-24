// project-stage.repository.ts
import mongoose, { ClientSession, HydratedDocument } from "mongoose";
import {
    CreateApplicationDTO,
    ExistsApplicationDTO,
    FindByIdOptions,
    GetApplicationDTO,
    UpdateApplicationDTO
} from "./application.dto";
import { ApplicationStatus, IApplication, Application } from "./application.model";

export interface IApplicationRepository {
    findById(id: string, options?: FindByIdOptions, session?: ClientSession): Promise<IApplication | null>;
    find(filters: GetApplicationDTO, session?: ClientSession): Promise<IApplication[]>;
    findOneByProjectAndStage(projectId: string,
        grantStageId?: string,
        callStageId?: string,
    ): Promise<IApplication | null>;
    findLatestByProject(projectId: string, session?: ClientSession): Promise<IApplication | null>;
    create(dto: CreateApplicationDTO, session?: ClientSession): Promise<IApplication>;
    update(id: string, status: UpdateApplicationDTO["data"]): Promise<IApplication | null>;
    updateStatus(id: string, newStatus: ApplicationStatus): Promise<IApplication | null>;
    countByProject(projectId: string, session?: ClientSession): Promise<number>;
    exists(filters: ExistsApplicationDTO): Promise<boolean>;
    delete(id: string): Promise<IApplication | null>;
}


// MongoDB implementation
export class ApplicationRepository implements IApplicationRepository {

    async findById(
        id: string,
        options?: FindByIdOptions,
        session?: ClientSession
    ) {
        let dbQuery = Application.findById(
            new mongoose.Types.ObjectId(id)
        );

        const populate = options?.populate;

        if (populate?.project) {
            dbQuery = dbQuery.populate("project");
        }

        if (populate?.grantStage) {
            dbQuery = dbQuery.populate("stage");
        }

        // ✅ attach session if provided
        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery.lean<IApplication>().exec();
    }

    async find(options: GetApplicationDTO, session?: ClientSession) {
        const query: any = {};

        // 1. Direct Filters
        if (options.project) {
            query.project = new mongoose.Types.ObjectId(options.project);
        }

        if (options.stage) {
            query.stage = new mongoose.Types.ObjectId(options.stage);
        }

        if (options.status) {
            query.status = options.status;
        }

       

        // Main query
        const dbQuery = Application.find(query);

        if (session) {
            dbQuery.session(session);
        }

        // 3. Populate
        if (options.populate) {
            dbQuery
                .populate({
                    path: "project",
                    populate: {
                        path: "applicant",
                    }
                })
                .populate("stage");
        }

        return dbQuery
            .lean<IApplication[]>()
            .exec();
    }

    async findOneByProjectAndStage(
        projectId: string,
        stageId?: string,
        callStageId?: string
    ) {
        const query: any = {
            project: new mongoose.Types.ObjectId(projectId)
        };

        if (stageId) {
            query.stage = new mongoose.Types.ObjectId(stageId);
        }

        if (callStageId) {
            query.callStage = new mongoose.Types.ObjectId(callStageId);
        }

        return Application.findOne(query)
            .lean<IApplication>()
            .exec();
    }

    async create(dto: CreateApplicationDTO, session?: ClientSession): Promise<HydratedDocument<IApplication>> {
        const data: Partial<IApplication> = {
            project: new mongoose.Types.ObjectId(dto.project),
            stage: new mongoose.Types.ObjectId(dto.stage),
            documentPath: dto.documentPath
        };
        return Application.create([data], { session }).then(res => res[0]);
    }

    async update(id: string, dtoData: UpdateApplicationDTO["data"]): Promise<IApplication | null> {
        const updateData: Partial<IApplication> = {};

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore = dtoData.totalScore;
        }
        return Application.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

    }

    async updateStatus(id: string, newStatus: ApplicationStatus) {
        return Application.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async countByProject(projectId: string, session?: ClientSession) {
        let query = Application.countDocuments({
            project: new mongoose.Types.ObjectId(projectId)
        });

        if (session) {
            query = query.session(session);
        }
        return query.exec();
    }

    async findLatestByProject(
        project: string,
        session?: ClientSession
    ) {
        let dbQuery = Application.findOne({
            project: new mongoose.Types.ObjectId(project)
        })
            .sort({ createdAt: -1 });

        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery
            .lean<IApplication>()
            .exec();
    }

    async exists(filters: ExistsApplicationDTO): Promise<boolean> {
        const query: any = {};

        const { stage: grantStage, project } = filters;

        if (grantStage) {
            query.grantStage = new mongoose.Types.ObjectId(grantStage);
        }

        
        if (project) {
            query.project = new mongoose.Types.ObjectId(project);
        }
        const result = await Application.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Application.findByIdAndDelete(id).exec();
    }
}
