// project.repository.ts
import mongoose from "mongoose";
import { FilterOptions } from "../../common/dtos/filter.dto";
import {
    CreateProjectDTO,
    FilterProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";
import { IProject, Project, ProjectStatus } from "./project.model";

export interface IProjectRepository {
    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IProject | null>;

    find(
        filters: FilterProjectsDTO,
        options?: FilterOptions
    ): Promise<Partial<IProject>[]>;

    create(
        dto: CreateProjectDTO,
        userId: string
    ): Promise<IProject>;

    update(
        id: string,
        data: UpdateProjectDTO["data"],
        userId?: string
    ): Promise<IProject | null>;

    incrementTotals(
        projectId: string,
        delta: {
            duration?: number;
            budget?: number;
            collabs?: number;
        }
    ): Promise<IProject | null>;

    updateStatus(
        id: string,
        newStatus: ProjectStatus,
        userId: string
    ): Promise<IProject | null>;

    exists(
        filters: FilterProjectsDTO
    ): Promise<boolean>;

    delete(
        id: string
    ): Promise<IProject | null>;
}


export class ProjectRepository implements IProjectRepository {

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IProject | null> {

        let dbQuery = Project.findById(
            new mongoose.Types.ObjectId(id)
        );

        if (options?.populate) {
            dbQuery = dbQuery
                .populate("leadPI")
                .populate("calendar")
                .populate("grant")
                .populate("themes")
                .populate("createdBy");
        }

        return dbQuery.lean<IProject>().exec();
    }


    async find(
        filters: FilterProjectsDTO,
        options?: FilterOptions
    ): Promise<Partial<IProject>[]> {

        const query: Record<string, any> = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.leadPI) {
            query.leadPI = new mongoose.Types.ObjectId(
                filters.leadPI
            );
        }

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(
                filters.grant
            );
        }

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(
                filters.call
            );
        }

        if (filters.calendar) {
            query.calendar = new mongoose.Types.ObjectId(
                filters.calendar
            );
        }

        let dbQuery = Project.find(query);

        if (options?.populate) {
            dbQuery = dbQuery
                .populate("leadPI")
                .populate("grant")
                .populate("calendar")
                .populate("themes")
                .populate("createdBy");
        }

        return dbQuery.lean<IProject[]>().exec();
    }


    async create(
        dto: CreateProjectDTO,
        userId: string
    ): Promise<IProject> {

        const data = {
            ...dto,

            calendar: dto.calendar
                ? new mongoose.Types.ObjectId(dto.calendar)
                : undefined,

            call: dto.call
                ? new mongoose.Types.ObjectId(dto.call)
                : undefined,

            grant: new mongoose.Types.ObjectId(dto.grant),

            leadPI: new mongoose.Types.ObjectId(dto.leadPI),

            themes: dto.themes?.map(
                themeId => new mongoose.Types.ObjectId(themeId)
            ),

            createdBy: new mongoose.Types.ObjectId(userId)
        };

        return Project.create(data);
    }

    async update(
        id: string,
        dtoData: UpdateProjectDTO["data"],
        userId?: string
    ): Promise<IProject | null> {

        const updateData: Partial<IProject> = {};

        if (dtoData.title !== undefined) {
            updateData.title = dtoData.title;
        }

        if (dtoData.summary !== undefined) {
            updateData.summary = dtoData.summary;
        }

        if (dtoData.totalBudget !== undefined) {
            updateData.totalBudget = dtoData.totalBudget;
        }

        if (dtoData.totalDuration !== undefined) {
            updateData.totalDuration = dtoData.totalDuration;
        }

        if (dtoData.totalCollabs !== undefined) {
            updateData.totalCollabs = dtoData.totalCollabs;
        }

        if (dtoData.themes !== undefined) {
            updateData.themes = dtoData.themes.map(
                themeId => new mongoose.Types.ObjectId(themeId)
            );
        }

        if (dtoData.call !== undefined) {
            updateData.call = dtoData.call
                ? new mongoose.Types.ObjectId(dtoData.call)
                : null;
        }

        if (dtoData.calendar !== undefined) {
            updateData.calendar = dtoData.calendar
                ? new mongoose.Types.ObjectId(dtoData.calendar)
                : null;
        }

        if (dtoData.currentApplication !== undefined) {
            updateData.currentApplication =
                dtoData.currentApplication
                    ? new mongoose.Types.ObjectId(dtoData.currentApplication)
                    : null;
        }

        if (dtoData.currentPhase !== undefined) {
            updateData.currentPhase =
                dtoData.currentPhase
                    ? new mongoose.Types.ObjectId(dtoData.currentPhase)
                    : null;
        }

        if (dtoData.currentVerification !== undefined) {
            updateData.currentVerification =
                dtoData.currentVerification
                    ? new mongoose.Types.ObjectId(dtoData.currentVerification)
                    : null;
        }

        if (userId) {
            updateData.updatedBy = new mongoose.Types.ObjectId(userId);
        }

        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: updateData
            },
            {
                new: true
            }
        ).exec();
    }


    async incrementTotals(
        projectId: string,
        delta: {
            duration?: number;
            budget?: number;
            collabs?: number;
        }
    ) {
        return Project.findByIdAndUpdate(
            projectId,
            {
                $inc: {
                    ...(delta.duration !== undefined && {
                        totalDuration: delta.duration
                    }),
                    ...(delta.budget !== undefined && {
                        totalBudget: delta.budget
                    }),
                    ...(delta.collabs !== undefined && {
                        totalCollabs: delta.collabs
                    })
                }
            },
            {
                new: true
            }
        ).exec();
    }


    async updateStatus(
        id: string,
        status: ProjectStatus,
        userId: string
    ): Promise<IProject | null> {

        return Project.findByIdAndUpdate(
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
                                userId
                            ),
                        changedAt: new Date()
                    }
                }
            },
            {
                new: true,
                runValidators: true
            }
        ).exec();
    }


    async exists(
        filters: FilterProjectsDTO
    ): Promise<boolean> {

        const query: Record<string, any> = {};

        if (filters.title) {
            query.title = filters.title;
        }

        if (filters.leadPI) {
            query.leadPI = new mongoose.Types.ObjectId(
                filters.leadPI
            );
        }

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(
                filters.grant
            );
        }

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(
                filters.call
            );
        }

        if (filters.calendar) {
            query.calendar = new mongoose.Types.ObjectId(
                filters.calendar
            );
        }

        const result = await Project.exists(query).exec();

        return result !== null;
    }


    async delete(
        id: string
    ): Promise<IProject | null> {

        return Project.findByIdAndDelete(id).exec();
    }
}

