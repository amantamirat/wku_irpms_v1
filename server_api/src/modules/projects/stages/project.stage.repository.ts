// project-stage.repository.ts
import mongoose, { ClientSession, HydratedDocument } from "mongoose";
import { ProjectStage, IProjectStage } from "./project.stage.model";
import {
    CreateProjectStageDTO,
    ExistsStageDTO,
    FindByIdOptions,
    GetProjectStageDTO,
    UpdateStageDTO
} from "./project.stage.dto";
import { ProjectStageStatus } from "./project.stage.model";
import { Project } from "../project.model";

export interface IProjectStageRepository {
    findById(id: string, options?: FindByIdOptions, session?: ClientSession): Promise<IProjectStage | null>;
    find(filters: GetProjectStageDTO, session?: ClientSession): Promise<IProjectStage[]>;
    findOneByProjectAndStage(projectId: string,
        grantStageId?: string,
        callStageId?: string,
    ): Promise<IProjectStage | null>;
    findLatestByProject(projectId: string, session?: ClientSession): Promise<IProjectStage | null>;
    create(dto: CreateProjectStageDTO, session?: ClientSession): Promise<IProjectStage>;
    update(id: string, status: UpdateStageDTO["data"]): Promise<IProjectStage | null>;
    updateStatus(id: string, newStatus: ProjectStageStatus): Promise<IProjectStage | null>;
    countByProject(projectId: string, session?: ClientSession): Promise<number>;
    exists(filters: ExistsStageDTO): Promise<boolean>;
    delete(id: string): Promise<IProjectStage | null>;
}


// MongoDB implementation
export class ProjectStageRepository implements IProjectStageRepository {

    async findById(
        id: string,
        options?: FindByIdOptions,
        session?: ClientSession
    ) {
        let dbQuery = ProjectStage.findById(
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

        return dbQuery.lean<IProjectStage>().exec();
    }

    async find(options: GetProjectStageDTO, session?: ClientSession) {
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

        // 2. Filter by Grant Allocation (Inside the Project)
        if (options.grantAllocation) {
            const projectQuery = Project.find({
                grantAllocation: new mongoose.Types.ObjectId(options.grantAllocation)
            }).select("_id").lean();

            if (session) {
                projectQuery.session(session);
            }

            const projectsInAllocation = await projectQuery;

            const projectIds = projectsInAllocation.map(p => p._id);

            query.project = { $in: projectIds };
        }

        // Main query
        const dbQuery = ProjectStage.find(query);

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
            .lean<IProjectStage[]>()
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

        return ProjectStage.findOne(query)
            .lean<IProjectStage>()
            .exec();
    }

    async create(dto: CreateProjectStageDTO, session?: ClientSession): Promise<HydratedDocument<IProjectStage>> {
        const data: Partial<IProjectStage> = {
            project: new mongoose.Types.ObjectId(dto.project),
            grantStage: new mongoose.Types.ObjectId(dto.grantStage),
            callStage: new mongoose.Types.ObjectId(dto.callStage),
            documentPath: dto.documentPath
        };
        return ProjectStage.create([data], { session }).then(res => res[0]);
    }

    async update(id: string, dtoData: UpdateStageDTO["data"]): Promise<IProjectStage | null> {
        const updateData: Partial<IProjectStage> = {};

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore = dtoData.totalScore;
        }
        return ProjectStage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

    }

    async updateStatus(id: string, newStatus: ProjectStageStatus) {
        return ProjectStage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async countByProject(projectId: string, session?: ClientSession) {
        let query = ProjectStage.countDocuments({
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
        let dbQuery = ProjectStage.findOne({
            project: new mongoose.Types.ObjectId(project)
        })
            .sort({ createdAt: -1 });

        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery
            .lean<IProjectStage>()
            .exec();
    }

    async exists(filters: ExistsStageDTO): Promise<boolean> {
        const query: any = {};

        const { grantStage, callStage, project } = filters;

        if (grantStage) {
            query.grantStage = new mongoose.Types.ObjectId(grantStage);
        }

        if (callStage) {
            query.callStage = new mongoose.Types.ObjectId(callStage);
        }
        if (project) {
            query.project = new mongoose.Types.ObjectId(project);
        }
        const result = await ProjectStage.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return ProjectStage.findByIdAndDelete(id).exec();
    }
}
