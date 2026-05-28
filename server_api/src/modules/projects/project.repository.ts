// project.repository.ts
import mongoose, { ClientSession } from "mongoose";
import { Project, IProject } from "./project.model";
import {
    CreateProjectDTO,
    ExistsProjectDTO,
    Options,
    GetProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";
import { GrantAllocation } from "../grants/allocations/grant.allocation.model";
import { ProjectStatus } from "./project.model";

export interface IProjectRepository {
    findById(id: string, options?: Options, session?: ClientSession): Promise<IProject | null>;
    find(filters: GetProjectsDTO): Promise<Partial<IProject>[]>;
    create(dto: CreateProjectDTO, session?: ClientSession): Promise<IProject>;
    update(id: string, data: UpdateProjectDTO["data"]): Promise<IProject | null>;
    updateStatus(id: string, newStatus: ProjectStatus, session?: ClientSession): Promise<IProject | null>;
    incrementTotals(projectId: string, delta: { duration: number; budget: number }, session?: ClientSession): Promise<IProject | null>;
    updateTotalCollabs(
        projectId: string,
        delta: number,
        session?: ClientSession
    ): Promise<IProject | null>;
    updateCurrentStage(
        id: string,
        currentStage: string,
        session?: ClientSession
    ): Promise<IProject | null>;
    clearCurrentStage(
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
        options?: Options,
        session?: ClientSession
    ) {
        let dbQuery = Project.findById(new mongoose.Types.ObjectId(id));

        const populate = options?.populate;

        if (populate?.applicant) {
            dbQuery = dbQuery.populate("applicant");
        }

        if (populate?.grant) {
            dbQuery = dbQuery.populate("grant");
        }

        if (populate?.currentStage) {
            dbQuery = dbQuery.populate("currentStage");
        }

        // ✅ attach session if provided
        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery.lean<IProject>().exec();
    }

    async find(
        filters: GetProjectsDTO,
        session?: ClientSession
    ) {
        const query: any = {};

        // status
        if (filters.status) {
            query.status = filters.status;
        }

        // applicant
        if (filters.applicant) {
            query.applicant = new mongoose.Types.ObjectId(filters.applicant);
        }

        // grant
        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(filters.grant);
        }

        // call
        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        let dbQuery = Project.find(query);

        const populate = filters.options?.populate;

        // applicant populate
        if (populate?.applicant) {
            dbQuery = dbQuery.populate("applicant");
        }

        // grant populate
        if (populate?.grant) {
            dbQuery = dbQuery.populate("grant");
        }

        // currentStage populate
        if (populate?.currentStage) {
            dbQuery = dbQuery.populate("currentStage");
        }

        // session
        if (session) {
            dbQuery = dbQuery.session(session);
        }

        return dbQuery.lean<IProject[]>().exec();
    }

    async create(dto: CreateProjectDTO, session?: ClientSession) {
        const data = {
            ...dto,
            call: dto.call ? new mongoose.Types.ObjectId(dto.call) : undefined,
            grant: new mongoose.Types.ObjectId(dto.grant),
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            themes: dto.themes?.map(thm => new mongoose.Types.ObjectId(thm)),
        };

        const created = await Project.create([data], { session });

        return created[0];
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

    async updateCurrentStage(
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

    async clearCurrentStage(
        project: string,
        session?: ClientSession
    ) {
        let dbQuery = Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(project),
            {
                $unset: {
                    currentStage: 1
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
        const { applicant, grant, call } = filters;
        if (applicant) {
            query.applicant = new mongoose.Types.ObjectId(applicant);
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
