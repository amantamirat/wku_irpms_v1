import mongoose from "mongoose";

import { FilterOptions } from "../../common/dtos/filter.dto";


import {
    CreateProjectDTO,
    FilterProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";

import {
    IProject,
    Project,
    ProjectStatus
} from "./project.model";
import { toObjectId } from "../../common/utils/mongoose.utils";
import { ScopeFilter } from "../auth/auth.types";


export interface IProjectRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IProject | null>;

    find(
        filters: FilterProjectsDTO,
        options?: FilterOptions,
        scopeFilter?: ScopeFilter,
    ): Promise<IProject[]>;

    findIdsByFilter(
        scopeFilter: Record<string, unknown>
    ): Promise<mongoose.Types.ObjectId[]>;

    create(
        data: CreateProjectData,
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
        status: ProjectStatus,
        userId: string
    ): Promise<IProject | null>;

    exists(
        filters: FilterProjectsDTO
    ): Promise<boolean>;

    delete(
        id: string
    ): Promise<IProject | null>;
}


/**
 * Data required by the repository to persist a project.
 *
 * workspace and organization are resolved by the service,
 * not supplied directly by the client.
 */
export interface CreateProjectData
    extends CreateProjectDTO {

    organization: string;
    workspace: string;
}


export class ProjectRepository
    implements IProjectRepository {

    private buildFilter(
        filters: FilterProjectsDTO
    ): Record<string, unknown> {

        const query: Record<string, unknown> = {};

        if (filters.ids?.length) {
            query._id = {
                $in: filters.ids.map(toObjectId)
            };
        }

        if (filters.grant) {
            query.grant = toObjectId(
                filters.grant
            );
        }

        if (filters.grantIds?.length) {
            query.grant = {
                $in: filters.grantIds.map(toObjectId)
            };
        }

        if (filters.organization) {
            query.organization =
                toObjectId(filters.organization);
        }

        if (filters.workspace) {
            query.workspace =
                toObjectId(filters.workspace);
        }

        if (filters.calendar) {
            query.calendar =
                toObjectId(filters.calendar);
        }

        if (filters.call) {
            query.call =
                toObjectId(filters.call);
        }

        if (filters.leadPI) {
            query.leadPI =
                toObjectId(filters.leadPI);
        }

        if (filters.title) {
            query.title = filters.title;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return query;
    }


    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IProject | null> {

        let dbQuery = Project.findById(
            toObjectId(id)
        );

        if (options?.populate) {
            dbQuery = dbQuery
                .populate("leadPI")
                .populate("grant")
                .populate("organization")
                .populate("workspace")
                .populate("calendar")
                .populate("themes")
                .populate("currentApplication")
                .populate("currentPhase")
                .populate("currentVerification")
                .populate("createdBy");
        }

        return dbQuery
            .lean<IProject>()
            .exec();
    }


    async find(
        filters: FilterProjectsDTO,
        options?: FilterOptions,
        scopeFilter?: ScopeFilter
    ): Promise<IProject[]> {

        const filter =
            this.buildFilter(filters);

        const query = scopeFilter
            ? { $and: [scopeFilter, filter] }
            : filter;

        let dbQuery =
            Project.find(query);

        if (options?.populate) {
            dbQuery = dbQuery
                .populate("leadPI")
                .populate("grant")
                .populate("organization")
                .populate("workspace")
                .populate("calendar")
                .populate("themes")
                .populate("currentApplication")
                .populate("currentPhase")
                .populate("currentVerification")
                .populate("createdBy");
        }

        return dbQuery
            .lean<IProject[]>()
            .exec();
    }

    async findIdsByFilter(
        filter: Record<string, unknown>
    ): Promise<mongoose.Types.ObjectId[]> {
        const projects =
            await Project.find(filter).select("_id").lean<{ _id: mongoose.Types.ObjectId }[]>().exec();
        return projects.map(project => project._id);
    }


    async create(
        data: CreateProjectData,
        userId: string
    ): Promise<IProject> {

        const project = {
            grant: toObjectId(data.grant),

            organization:
                toObjectId(data.organization),

            workspace:
                toObjectId(data.workspace),

            calendar: data.calendar
                ? toObjectId(data.calendar)
                : undefined,

            call: data.call
                ? toObjectId(data.call)
                : undefined,

            title: data.title,

            summary: data.summary,

            leadPI: toObjectId(data.leadPI),

            themes: data.themes.map(toObjectId),

            createdBy: toObjectId(userId)
        };

        return Project.create(project);
    }


    async update(
        id: string,
        data: UpdateProjectDTO["data"],
        userId?: string
    ): Promise<IProject | null> {

        const updateData: Partial<IProject> = {};

        if (data.title !== undefined) {
            updateData.title = data.title;
        }

        if (data.summary !== undefined) {
            updateData.summary = data.summary;
        }

        if (data.themes !== undefined) {
            updateData.themes =
                data.themes.map(toObjectId);
        }

        if (data.call !== undefined) {
            updateData.call = data.call
                ? toObjectId(data.call)
                : null;
        }

        if (data.calendar !== undefined) {
            updateData.calendar = data.calendar
                ? toObjectId(data.calendar)
                : null;
        }

        if (data.currentApplication !== undefined) {
            updateData.currentApplication =
                data.currentApplication
                    ? toObjectId(
                        data.currentApplication
                    )
                    : null;
        }

        if (data.currentPhase !== undefined) {
            updateData.currentPhase =
                data.currentPhase
                    ? toObjectId(
                        data.currentPhase
                    )
                    : null;
        }

        if (data.currentVerification !== undefined) {
            updateData.currentVerification =
                data.currentVerification
                    ? toObjectId(
                        data.currentVerification
                    )
                    : null;
        }

        if (userId) {
            updateData.updatedBy =
                toObjectId(userId);
        }

        return Project.findByIdAndUpdate(
            toObjectId(id),
            {
                $set: updateData
            },
            {
                new: true,
                runValidators: true
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
    ): Promise<IProject | null> {

        const increment: Record<string, number> = {};

        if (delta.duration !== undefined) {
            increment.totalDuration =
                delta.duration;
        }

        if (delta.budget !== undefined) {
            increment.totalBudget =
                delta.budget;
        }

        if (delta.collabs !== undefined) {
            increment.totalCollabs =
                delta.collabs;
        }

        if (!Object.keys(increment).length) {
            return Project.findById(
                toObjectId(projectId)
            ).exec();
        }

        return Project.findByIdAndUpdate(
            toObjectId(projectId),
            {
                $inc: increment
            },
            {
                new: true,
                runValidators: true
            }
        ).exec();
    }


    async updateStatus(
        id: string,
        status: ProjectStatus,
        userId: string
    ): Promise<IProject | null> {

        return Project.findByIdAndUpdate(
            toObjectId(id),
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
        ).exec();
    }


    async exists(
        filters: FilterProjectsDTO
    ): Promise<boolean> {

        const query =
            this.buildFilter(filters);

        const result =
            await Project.exists(query).exec();

        return result !== null;
    }


    async delete(
        id: string
    ): Promise<IProject | null> {

        return Project.findByIdAndDelete(
            toObjectId(id)
        ).exec();
    }
}

