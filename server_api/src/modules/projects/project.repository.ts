import mongoose from "mongoose";

import { FilterOptions } from "../../common/dtos/filter.dto";


import {
    FilterProjectsDTO,
    CreateProjectDto,
    UpdateProjectDTO
} from "./project.dto";

import { toObjectId } from "../../common/utils/mongoose.utils";
import { ScopeFilter } from "../auth/auth.types";
import {
    IProject,
    Project,
    ProjectStatus
} from "./project.model";
import { IStatusHistory } from "../../common/types/status-history";
import { SYSTEM } from "../../common/constants/system.constant";


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
        data: Partial<UpdateProjectData>,
        userId?: string
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
    extends CreateProjectDto {
    organization?: string;
    workspace?: string;
    conceptNoteId?: string;
    status?: ProjectStatus;
}

export interface UpdateProjectData extends UpdateProjectDTO {
    currentApplication?: string | null;
    currentPhase?: string | null;
    currentVerification?: string | null;
    leadPI?: string | null;
    status?: ProjectStatus;
    statusHistory?: IStatusHistory<ProjectStatus>;
}

function populate(dbQuery: any) {
    return dbQuery
        .populate("leadPI")
        .populate("grant")
        .populate("call")
        .populate("organization")
        .populate("workspace")
        .populate("calendar")
        .populate("themes")
        .populate("currentApplication")
        //.populate("currentPhase")
        .populate("currentVerification")
        .populate("createdBy")
        .populate({
            path: "statusHistory.changedBy",
            select: "_id name",
        });
}


export class ProjectRepository
    implements IProjectRepository {

    private buildFilter(
        filters: FilterProjectsDTO
    ): Record<string, unknown> {

        const query: Record<string, unknown> = {};

        if (filters.id) {
            query._id = filters.id
        }

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
            dbQuery = populate(dbQuery)
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
            dbQuery = populate(dbQuery)
        }

        return dbQuery
            .sort({ createdAt: -1 }) // newest first
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
        return Project.create({
            ...data,
            grant: toObjectId(data.grant),
            calendar: data.calendar ? toObjectId(data.calendar) : undefined,
            organization: data.organization ? toObjectId(data.organization) : undefined,
            workspace: data.workspace ? toObjectId(data.workspace) : undefined,
            call: data.call ? toObjectId(data.call) : undefined,
            leadPI: data.leadPI ? toObjectId(data.leadPI) : undefined,
            themes: data.themes?.map(toObjectId) ?? [],
            createdBy: toObjectId(userId),
        });
    }


    async update(
        id: string,
        data: Partial<UpdateProjectData>,
        userId: string
    ): Promise<IProject | null> {
        const { status, statusHistory, leadPI, ...rest } = data;

        const updateData = {
            ...rest,
            ...(rest.themes && {
                themes: rest.themes.map(toObjectId),
            }),
            ...(rest.currentApplication !== undefined && {
                currentApplication: rest.currentApplication
                    ? toObjectId(rest.currentApplication)
                    : null,
            }),
            ...(rest.currentPhase !== undefined && {
                currentPhase: rest.currentPhase
                    ? toObjectId(rest.currentPhase)
                    : null,
            }),
            ...(rest.currentVerification !== undefined && {
                currentVerification: rest.currentVerification
                    ? toObjectId(rest.currentVerification)
                    : null,
            }),
            ...(rest.objectives && {
                objectives: {
                    general: rest.objectives.general,
                    specific: rest.objectives.specific ?? [],
                    expectedOutputs: rest.objectives.expectedOutputs ?? [],
                },
            }),
            ...(leadPI !== undefined && {
                leadPI: leadPI ? toObjectId(leadPI) : null,
            }),
            ...(userId !== SYSTEM.SU_USER && {
                updatedBy: toObjectId(userId),
            }),
        };

        return Project.findByIdAndUpdate(
            toObjectId(id),
            {
                $set: {
                    ...updateData,
                    ...(status !== undefined && { status }),
                },
                ...(statusHistory && {
                    $push: { statusHistory },
                }),
            },
            { new: true, runValidators: true }
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

