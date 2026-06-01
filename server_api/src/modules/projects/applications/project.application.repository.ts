// project-stage.repository.ts
import mongoose, { ClientSession, HydratedDocument } from "mongoose";
import {
    CreateProjectApplicationDTO,
    ExistsApplicationDTO,
    FindByIdOptions,
    GetProjectApplicationDTO,
    UpdateApplicationDTO
} from "./project.application.dto";
import { ApplicationStatus, IProjectApplication, ProjectApplication } from "./project.application.model";

export interface IProjectApplicationRepository {
    findById(id: string, options?: FindByIdOptions, session?: ClientSession): Promise<IProjectApplication | null>;
    find(filters: GetProjectApplicationDTO, session?: ClientSession): Promise<IProjectApplication[]>;
    findOneByProjectAndStage(projectId: string,
        grantStageId?: string,
        callStageId?: string,
    ): Promise<IProjectApplication | null>;
    findLatestByProject(projectId: string, session?: ClientSession): Promise<IProjectApplication | null>;
    create(dto: CreateProjectApplicationDTO, session?: ClientSession): Promise<IProjectApplication>;
    update(id: string, status: UpdateApplicationDTO["data"]): Promise<IProjectApplication | null>;
    updateStatus(id: string, newStatus: ApplicationStatus): Promise<IProjectApplication | null>;
    countByProject(projectId: string, session?: ClientSession): Promise<number>;
    exists(filters: ExistsApplicationDTO): Promise<boolean>;
    delete(id: string): Promise<IProjectApplication | null>;
}


// MongoDB implementation
export class ProjectApplicationRepository implements IProjectApplicationRepository {

    async findById(
        id: string,
        options?: FindByIdOptions,
        session?: ClientSession
    ) {
        let dbQuery = ProjectApplication.findById(
            new mongoose.Types.ObjectId(id)
        );

        const populate = options?.populate;

        if (populate?.project) {
            dbQuery = dbQuery.populate("project");
        }

        if (populate?.grantStage) {
            dbQuery = dbQuery.populate("grantStage");
        }

        // ✅ attach session if provided
        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery.lean<IProjectApplication>().exec();
    }

    async find(options: GetProjectApplicationDTO, session?: ClientSession) {
        const query: any = {};

        // 1. Direct Filters
        if (options.project) {
            query.project = new mongoose.Types.ObjectId(options.project);
        }

        if (options.grantStage) {
            query.grantStage = new mongoose.Types.ObjectId(options.grantStage);
        }

        if (options.status) {
            query.status = options.status;
        }

       

        // Main query
        const dbQuery = ProjectApplication.find(query);

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
                .populate("grantStage");
        }

        return dbQuery
            .lean<IProjectApplication[]>()
            .exec();
    }

    async findOneByProjectAndStage(
        projectId: string,
        grantStageId?: string,
        callStageId?: string
    ) {
        const query: any = {
            project: new mongoose.Types.ObjectId(projectId)
        };

        if (grantStageId) {
            query.grantStage = new mongoose.Types.ObjectId(grantStageId);
        }

        if (callStageId) {
            query.callStage = new mongoose.Types.ObjectId(callStageId);
        }

        return ProjectApplication.findOne(query)
            .lean<IProjectApplication>()
            .exec();
    }

    async create(dto: CreateProjectApplicationDTO, session?: ClientSession): Promise<HydratedDocument<IProjectApplication>> {
        const data: Partial<IProjectApplication> = {
            project: new mongoose.Types.ObjectId(dto.project),
            grantStage: new mongoose.Types.ObjectId(dto.grantStage),
            //callStage: new mongoose.Types.ObjectId(dto.callStage),
            documentPath: dto.documentPath
        };
        return ProjectApplication.create([data], { session }).then(res => res[0]);
    }

    async update(id: string, dtoData: UpdateApplicationDTO["data"]): Promise<IProjectApplication | null> {
        const updateData: Partial<IProjectApplication> = {};

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore = dtoData.totalScore;
        }
        return ProjectApplication.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

    }

    async updateStatus(id: string, newStatus: ApplicationStatus) {
        return ProjectApplication.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async countByProject(projectId: string, session?: ClientSession) {
        let query = ProjectApplication.countDocuments({
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
        let dbQuery = ProjectApplication.findOne({
            project: new mongoose.Types.ObjectId(project)
        })
            .sort({ createdAt: -1 });

        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery
            .lean<IProjectApplication>()
            .exec();
    }

    async exists(filters: ExistsApplicationDTO): Promise<boolean> {
        const query: any = {};

        const { grantStage, project } = filters;

        if (grantStage) {
            query.grantStage = new mongoose.Types.ObjectId(grantStage);
        }

        
        if (project) {
            query.project = new mongoose.Types.ObjectId(project);
        }
        const result = await ProjectApplication.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return ProjectApplication.findByIdAndDelete(id).exec();
    }
}
