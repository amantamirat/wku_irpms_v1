// collaborator.repository.ts

import mongoose from "mongoose";

import {
    CreateCollaboratorDto,
    FilterCollaborators,
    UpdateCollaboratorDto
} from "./collaborator.dto";

import {
    Collaborator,
    CollaboratorStatus,
    ICollaborator
} from "./collaborator.model";

import { FilterOptions } from "../../../common/dtos/filter.dto";
import { ScopeFilter } from "../../auth/auth.types";


export interface ICollaboratorRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<ICollaborator | null>;

    findOne(
        filters?: FilterCollaborators,
        options?: FilterOptions
    ): Promise<ICollaborator | null>;

    find(
        filters?: FilterCollaborators,
        options?: FilterOptions,
        scopeFilter?: ScopeFilter
    ): Promise<ICollaborator[]>;

    create(
        dto: CreateCollaboratorDto
    ): Promise<ICollaborator>;

    createMany(
        dtos: CreateCollaboratorDto[]
    ): Promise<ICollaborator[]>;

    update(
        id: string,
        data: UpdateCollaboratorDto["data"]
    ): Promise<ICollaborator | null>;

    updateStatus(
        id: string,
        newStatus: CollaboratorStatus
    ): Promise<ICollaborator | null>;

    exists(
        filters: FilterCollaborators
    ): Promise<boolean>;

    existsUnverified(
        project: string
    ): Promise<boolean>;

    countByProject(
        project: string
    ): Promise<number>;

    delete(
        id: string
    ): Promise<ICollaborator | null>;

    deleteByProject(
        project: string
    ): Promise<any>;
}


export class CollaboratorRepository
    implements ICollaboratorRepository {

    /**
     * Build MongoDB filter from collaborator filters.
     */
    private buildFilter(
        filters: FilterCollaborators = {}
    ): Record<string, any> {

        const query: Record<string, any> = {};

        if (filters.project) {
            query.project =
                new mongoose.Types.ObjectId(filters.project);
        }

        /*
        if (filters.projectIds?.length) {
            query.project = {
                $in: filters.projectIds.map(
                    id => new mongoose.Types.ObjectId(id)
                )
            };
        }

        if (filters.memberIds?.length) {
            query.member = {
                $in: filters.memberIds.map(
                    id => new mongoose.Types.ObjectId(id)
                )
            };
        }
        */

        if (filters.member) {
            query.member =
                new mongoose.Types.ObjectId(filters.member);
        }

        if (filters.isLead !== undefined) {
            query.isLeadPI = filters.isLead;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return query;
    }


    /**
     * Find collaborator by ID.
     */
    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<ICollaborator | null> {

        let dbQuery =
            Collaborator.findById(
                new mongoose.Types.ObjectId(id)
            );

        if (options?.populate) {
            dbQuery.populate([
                {
                    path: "member",
                    populate: {
                        path: "workspace"
                    }
                },
                {
                    path: "project",
                    populate: {
                        path: "leadPI"
                    }
                }
            ]);
        }

        return dbQuery
            .lean<ICollaborator>()
            .exec();
    }


    /**
     * Find a single collaborator using filters.
     */
    async findOne(
        filters: FilterCollaborators = {},
        options?: FilterOptions
    ): Promise<ICollaborator | null> {

        const query =
            this.buildFilter(filters);

        let dbQuery =
            Collaborator.findOne(query);

        if (options?.populate) {
            dbQuery.populate([
                {
                    path: "member",
                    populate: {
                        path: "workspace"
                    }
                },
                {
                    path: "project",
                    populate: {
                        path: "leadPI"
                    }
                }
            ]);
        }

        return dbQuery
            .lean<ICollaborator>()
            .exec();
    }


    /**
     * Find collaborators using filters.
     */
    async find(
        filters: FilterCollaborators = {},
        options?: FilterOptions,
        scopeFilter?: ScopeFilter
    ): Promise<ICollaborator[]> {

        const filter =
            this.buildFilter(filters);

        const query = scopeFilter
            ? { $and: [scopeFilter, filter] }
            : filter;

        let dbQuery =
            Collaborator.find(query);

        if (options?.populate) {
            dbQuery.populate([
                {
                    path: "member",
                    populate: {
                        path: "workspace"
                    }
                },
                {
                    path: "project",
                    populate: {
                        path: "leadPI"
                    }
                }
            ]);
        }

        return dbQuery
            .lean<ICollaborator[]>()
            .exec();
    }


    /**
     * Create collaborator.
     */
    async create(
        dto: CreateCollaboratorDto
    ): Promise<ICollaborator> {

        const data: Partial<ICollaborator> = {
            ...dto,

            project:
                new mongoose.Types.ObjectId(dto.project),

            member:
                new mongoose.Types.ObjectId(dto.member)
        };

        return Collaborator
            .create(data)
            .then(doc => doc.toObject() as ICollaborator);
    }


    /**
     * Create multiple collaborators.
     */
    async createMany(
        dtos: CreateCollaboratorDto[]
    ): Promise<ICollaborator[]> {

        const data: Partial<ICollaborator>[] =
            dtos.map(dto => ({
                ...dto,

                project:
                    new mongoose.Types.ObjectId(dto.project),

                member:
                    new mongoose.Types.ObjectId(dto.member)
            }));

        const documents =
            await Collaborator.insertMany(
                data,
                {
                    ordered: true
                }
            );

        return documents as ICollaborator[];
    }


    /**
     * Update collaborator.
     */
    async update(
        id: string,
        dtoData: UpdateCollaboratorDto["data"]
    ): Promise<ICollaborator | null> {

        const updateData: Partial<ICollaborator> = {};

        if (dtoData.isLeadPI !== undefined) {
            updateData.isLeadPI =
                dtoData.isLeadPI;
        }

        if (dtoData.role !== undefined) {
            updateData.role =
                dtoData.role;
        }

        return Collaborator.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: updateData
            },
            {
                new: true,
                runValidators: true
            }
        )
            .lean<ICollaborator>()
            .exec();
    }


    /**
     * Update collaborator status.
     */
    async updateStatus(
        id: string,
        newStatus: CollaboratorStatus
    ): Promise<ICollaborator | null> {

        return Collaborator.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            {
                $set: {
                    status: newStatus
                }
            },
            {
                new: true,
                runValidators: true
            }
        )
            .lean<ICollaborator>()
            .exec();
    }


    /**
     * Check whether a collaborator exists.
     */
    async exists(
        filters: FilterCollaborators
    ): Promise<boolean> {

        const query =
            this.buildFilter(filters);

        if (!Object.keys(query).length) {
            return false;
        }

        const result =
            await Collaborator
                .exists(query)
                .exec();

        return result !== null;
    }


    /**
     * Check whether a project has any
     * collaborator that is not verified.
     */
    async existsUnverified(
        project: string
    ): Promise<boolean> {

        const result =
            await Collaborator.exists({
                project:
                    new mongoose.Types.ObjectId(project),

                status: {
                    $ne: CollaboratorStatus.verified
                }
            }).exec();

        return result !== null;
    }


    /**
     * Count collaborators belonging to a project.
     */
    async countByProject(
        project: string
    ): Promise<number> {

        return Collaborator
            .countDocuments({
                project:
                    new mongoose.Types.ObjectId(project)
            })
            .exec();
    }


    /**
     * Delete collaborator by ID.
     */
    async delete(
        id: string
    ): Promise<ICollaborator | null> {

        return Collaborator.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        )
            .lean<ICollaborator>()
            .exec();
    }


    /**
     * Delete all collaborators belonging to a project.
     */
    async deleteByProject(
        project: string
    ): Promise<any> {

        return Collaborator.deleteMany({
            project:
                new mongoose.Types.ObjectId(project)
        }).exec();
    }
}