// project.repository.ts
import mongoose, { ClientSession } from "mongoose";
import {
    CreateProjectDTO,
    ExistsProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";
import { IProject, Project, ProjectStatus } from "./project.model";

export interface IProjectRepository {
    findById(id: string, populate?: boolean): Promise<IProject | null>;
    find(filters: GetProjectsDTO): Promise<Partial<IProject>[]>;
    create(dto: CreateProjectDTO): Promise<IProject>;
    update(id: string, data: UpdateProjectDTO["data"]): Promise<IProject | null>;
    updateStatus(id: string, newStatus: ProjectStatus, session?: ClientSession): Promise<IProject | null>;
    incrementTotals(projectId: string, delta: { duration: number; budget: number }, session?: ClientSession): Promise<IProject | null>;
    updateTotalCollabs(
        projectId: string,
        delta: number,
        session?: ClientSession
    ): Promise<IProject | null>;
    updateCurrentApplication(
        id: string,
        currentStage: string,
        session?: ClientSession
    ): Promise<IProject | null>;
    clearCurrentApplication(
        project: string,
        session?: ClientSession
    ): Promise<IProject | null>;
    exists(filters: ExistsProjectDTO): Promise<boolean>;
    delete(id: string): Promise<IProject | null>;
}

// MongoDB implementation
export class ProjectRepository implements IProjectRepository {

    async findById(
        id: string,
        populate?: boolean
    ): Promise<IProject | null> {
        let dbQuery = Project.findById(new mongoose.Types.ObjectId(id));

        if (populate) {
            dbQuery = dbQuery
                .populate("leadPI")
                .populate("calendar")
                .populate("grant")
                .populate("themes");
        }

        return dbQuery.lean<IProject>().exec();
    }

    async find(filters: GetProjectsDTO) {
        const query: Record<string, any> = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.leadPI) {
            query.leadPI = new mongoose.Types.ObjectId(filters.leadPI);
        }

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(filters.grant);
        }

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        let dbQuery = Project.find(query);

        if (filters.populate) {
            dbQuery = dbQuery
                .populate("leadPI")
                .populate("grant")
                .populate("calendar")
                .populate("themes");
        }
        return dbQuery.lean<IProject[]>().exec();
    }
    async create(dto: CreateProjectDTO) {
        const data = {
            ...dto,
            calendar: dto.calendar ? new mongoose.Types.ObjectId(dto.calendar) : undefined,
            call: dto.call ? new mongoose.Types.ObjectId(dto.call) : undefined,
            grant: new mongoose.Types.ObjectId(dto.grant),
            leadPI: new mongoose.Types.ObjectId(dto.leadPI),
            themes: dto.themes?.map(thm => new mongoose.Types.ObjectId(thm)),
        };

        const created = await Project.create(data);

        return created;
    }

    async update(id: string, dtoData: UpdateProjectDTO["data"]): Promise<IProject | null> {
        const updateData: Partial<IProject> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.summary) updateData.summary = dtoData.summary;
        //if (dtoData.totalBudget) updateData.totalBudget = dtoData.totalBudget;
        //if (dtoData.totalDuration) updateData.totalDuration = dtoData.totalDuration;
        if (dtoData.themes) {
            updateData.themes = dtoData.themes.map(id => new mongoose.Types.ObjectId(id))
        }

        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async incrementTotals(
        projectId: string,
        delta: { duration: number; budget: number },
        session?: ClientSession
    ) {
        return Project.findByIdAndUpdate(
            projectId,
            {
                $inc: {
                    totalDuration: delta.duration,
                    totalBudget: delta.budget
                }
            },
            {
                session,          // <-- attach session here
                new: true         // optional: return updated document
            }
        );
    }

    async updateTotalCollabs(
        projectId: string,
        delta: number,
        session?: ClientSession
    ) {
        return Project.findByIdAndUpdate(
            projectId,
            {
                $inc: {
                    totalCollabs: delta
                }
            },
            {
                session,
                new: true
            }
        );
    }



    async updateStatus(
        id: string,
        newStatus: ProjectStatus,
        session?: ClientSession
    ) {
        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            {
                new: true,
                session // attach session here
            }
        ).exec();
    }

    // ✅ add inside ProjectRepository

    async updateCurrentApplication(
        id: string,
        currentStage: string,
        session?: ClientSession
    ) {
        const update =

        {
            $set: {
                currentStage: new mongoose.Types.ObjectId(currentStage)
            }
        }


        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            update,
            {
                new: true,
                session
            }
        ).exec();
    }

    async clearCurrentApplication(
        project: string,
        session?: ClientSession
    ) {
        let dbQuery = Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(project),
            {
                $unset: {
                    currentApplication: 1
                }
            },
            { new: true }
        );

        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery.exec();
    }

    async exists(filters: ExistsProjectDTO): Promise<boolean> {
        const query: any = {};
        const { leadPI, grant, call } = filters;
        if (leadPI) {
            query.leadPI = new mongoose.Types.ObjectId(leadPI);
        }
        if (grant) {
            query.grant = new mongoose.Types.ObjectId(grant);
        }
        if (call) {
            query.call = new mongoose.Types.ObjectId(call);
        }
        const result = await Project.exists(query).exec();
        return result !== null;
    }



    async delete(id: string) {
        return Project.findByIdAndDelete(id).exec();
    }
}
