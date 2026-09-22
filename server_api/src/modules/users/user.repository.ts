import mongoose from "mongoose";
import User, {
    IUser,
    Gender,
    Accessibility,
    UserScope
} from "./user.model";

import {
    CreateUserDTO,
    UpdateUserDTO,
    FilterUsersDTO,
    UpdateRolesDTO
} from "./user.dto";

import { FilterOptions } from "../../common/dtos/filter.dto";
import { toObjectId } from "../../common/utils/mongoose.utils";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";


export interface CreateUserData {
    workspace?: mongoose.Types.ObjectId;
    name: string;
    birthDate?: Date;
    gender?: Gender;
    fin?: string;
    orcid?: string;
    accessibility?: Accessibility[];
    specializations?: mongoose.Types.ObjectId[];
    roles: mongoose.Types.ObjectId[];
    scope: UserScope;
    isSystem?: boolean;
    createdBy?: mongoose.Types.ObjectId;
}


export interface IUserRepository {

    // -------------------------
    // READ ACTIVE USERS
    // -------------------------

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IUser | null>;

    findOne(
        filters: FilterUsersDTO
    ): Promise<IUser | null>;

    find(
        filter: FilterUsersDTO,
        options?: FilterOptions
    ): Promise<IUser[]>;


    // -------------------------
    // READ DELETED USERS
    // -------------------------

    findDeleted(
        filter: FilterUsersDTO,
        options?: FilterOptions
    ): Promise<IUser[]>;


    // -------------------------
    // CREATE
    // -------------------------

    create(
        data: CreateUserData
    ): Promise<IUser>;


    // -------------------------
    // UPDATE
    // -------------------------

    update(
        id: string,
        data: UpdateUserDTO["data"],
        updatedBy?: string
    ): Promise<IUser | null>;

    updateRoles(
        userId: string,
        dto: UpdateRolesDTO,
        updatedBy?: string
    ): Promise<IUser | null>;

    updateScope(
        id: string,
        scope: string[] | "*" | null,
        updatedBy?: string
    ): Promise<IUser | null>;


    // -------------------------
    // DELETE / RESTORE
    // -------------------------

    softDelete(
        id: string,
        deletedBy?: string
    ): Promise<IUser | null>;

    restore(
        id: string,
        restoredBy?: string
    ): Promise<IUser | null>;


    // -------------------------
    // EXISTS
    // -------------------------

    exists(
        filters: FilterUsersDTO
    ): Promise<boolean>;
}


export class UserRepository implements IUserRepository {

    // -------------------------
    // FIND ACTIVE BY ID
    // -------------------------

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IUser | null> {

        let query = User.findOne({
            _id: toObjectId(id),
            deletedAt: null
        });

        if (options?.populate) {
            query = query.populate("workspace");
        }

        return query
            .lean<IUser>()
            .exec();
    }


    // -------------------------
    // FIND ONE ACTIVE
    // -------------------------

    async findOne(
        { workspace, name }: FilterUsersDTO
    ): Promise<IUser | null> {

        const filter: Record<string, unknown> = {
            deletedAt: null
        };

        if (workspace) {
            filter.workspace = toObjectId(workspace);
        }

        if (name) {
            filter.name = name;
        }

        return User.findOne(filter)
            .lean<IUser>()
            .exec();
    }


    // -------------------------
    // FIND ACTIVE USERS
    // -------------------------

    async find(
        filter: FilterUsersDTO,
        options?: FilterOptions
    ): Promise<IUser[]> {

        const query: Record<string, unknown> = {
            deletedAt: null,
            isSystem: { $ne: true }
        };

        if (filter.workspace) {
            query.workspace = toObjectId(filter.workspace);
        }

        if (filter.ids?.length) {
            query._id = {
                $in: filter.ids.map(toObjectId)
            };
        }

        if (filter.name) {
            query.name = filter.name;
        }

        if (filter.specialization) {
            query.specializations = toObjectId(
                filter.specialization
            );
        }

        if (filter.role) {
            query.roles = toObjectId(
                filter.role
            );
        }

        let dbQuery = User.find(query);

        if (options?.populate) {
            dbQuery = dbQuery.populate("workspace");
        }

        return dbQuery
            .lean<IUser[]>()
            .exec();
    }


    // -------------------------
    // FIND DELETED USERS
    // -------------------------

    async findDeleted(
        filter: FilterUsersDTO,
        options?: FilterOptions
    ): Promise<IUser[]> {

        const query: Record<string, unknown> = {
            deletedAt: {
                $ne: null
            }
        };

        if (filter.workspace) {
            query.workspace = toObjectId(
                filter.workspace
            );
        }

        if (filter.ids?.length) {
            query._id = {
                $in: filter.ids.map(toObjectId)
            };
        }

        if (filter.name) {
            query.name = filter.name;
        }

        if (filter.specialization) {
            query.specializations = toObjectId(
                filter.specialization
            );
        }

        if (filter.role) {
            query.roles = toObjectId(
                filter.role
            );
        }

        let dbQuery = User.find(query);

        if (options?.populate) {
            dbQuery = dbQuery
                .populate("workspace");
        }

        return dbQuery
            .lean<IUser[]>()
            .exec();
    }


    // -------------------------
    // CREATE
    // -------------------------

    async create(
        data: CreateUserData
    ): Promise<IUser> {

        return User.create(data);
    }


    // -------------------------
    // UPDATE
    // -------------------------

    async update(
        id: string,
        dto: UpdateUserDTO["data"],
        updatedBy?: string
    ): Promise<IUser | null> {

        const userId = toObjectId(id);

        const updatedById = updatedBy
            ? toObjectId(updatedBy)
            : undefined;

        const update: Record<string, unknown> = {};

        if (dto.workspace !== undefined) {
            update.workspace = dto.workspace
                ? toObjectId(dto.workspace)
                : null;
        }

        if (dto.name !== undefined) {
            update.name = dto.name;
        }

        if (dto.birthDate !== undefined) {
            update.birthDate = dto.birthDate;
        }

        if (dto.gender !== undefined) {
            update.gender = dto.gender;
        }

        if (dto.fin !== undefined) {
            update.fin = dto.fin;
        }

        if (dto.orcid !== undefined) {
            update.orcid = dto.orcid;
        }

        if (dto.accessibility !== undefined) {
            update.accessibility = dto.accessibility;
        }

        if (dto.specializations !== undefined) {
            update.specializations =
                dto.specializations.map(toObjectId);
        }

        return User.findOneAndUpdate(
            {
                _id: userId,
                deletedAt: null
            },
            {
                $set: {
                    ...update,
                    ...(updatedById && {
                        updatedBy: updatedById
                    }),
                    updatedAt: new Date()
                }
            },
            { new: true }
        )
            .lean<IUser>()
            .exec();
    }


    // -------------------------
    // UPDATE ROLES
    // -------------------------

    async updateRoles(
        id: string,
        dto: UpdateRolesDTO,
        updatedBy?: string
    ): Promise<IUser | null> {

        const updatedById = updatedBy
            ? toObjectId(updatedBy)
            : undefined;

        return User.findOneAndUpdate(
            {
                _id: toObjectId(id),
                deletedAt: null
            },
            {
                $set: {
                    roles: dto.roles.map(toObjectId),
                    ...(updatedById && {
                        updatedBy: updatedById
                    }),
                    updatedAt: new Date()
                }
            },
            { new: true }
        )
            .lean<IUser>()
            .exec();
    }


    // -------------------------
    // UPDATE SCOPE
    // -------------------------

    async updateScope(
        userId: string,
        scope: string[] | "*" | null,
        updatedBy: string
    ): Promise<IUser> {

        const user =
            await User.findOneAndUpdate(
                {
                    _id: toObjectId(userId),
                    deletedAt: null
                },
                {
                    $set: {
                        scope,
                        updatedBy
                    }
                },
                {
                    new: true
                }
            )
                .lean<IUser>()
                .exec();

        if (!user) {
            throw new AppError(
                ERROR_CODES.USER_NOT_FOUND
            );
        }

        return user;
    }


    // -------------------------
    // SOFT DELETE
    // -------------------------

    async softDelete(
        id: string,
        deletedBy?: string
    ): Promise<IUser | null> {

        const userId = toObjectId(id);

        const deletedById = deletedBy
            ? toObjectId(deletedBy)
            : undefined;

        return User.findOneAndUpdate(
            {
                _id: userId,
                deletedAt: null
            },
            {
                $set: {
                    deletedAt: new Date(),
                    deletedBy: deletedById ?? null,
                    updatedAt: new Date(),
                    ...(deletedById && {
                        updatedBy: deletedById
                    })
                }
            },
            { new: true }
        )
            .lean<IUser>()
            .exec();
    }


    // -------------------------
    // RESTORE
    // -------------------------

    async restore(
        id: string,
        restoredBy?: string
    ): Promise<IUser | null> {

        const userId = toObjectId(id);

        const restoredById = restoredBy
            ? toObjectId(restoredBy)
            : undefined;

        return User.findOneAndUpdate(
            {
                _id: userId,
                deletedAt: {
                    $ne: null
                }
            },
            {
                $set: {
                    deletedAt: null,
                    deletedBy: null,
                    updatedAt: new Date(),
                    ...(restoredById && {
                        updatedBy: restoredById
                    })
                }
            },
            { new: true }
        )
            .lean<IUser>()
            .exec();
    }


    // -------------------------
    // EXISTS ACTIVE USER
    // -------------------------

    async exists(
        filters: FilterUsersDTO
    ): Promise<boolean> {

        const query: Record<string, unknown> = {
            deletedAt: null
        };

        if (filters.workspace) {
            query.workspace = toObjectId(
                filters.workspace
            );
        }

        if (filters.specialization) {
            query.specializations = toObjectId(
                filters.specialization
            );
        }

        if (filters.role) {
            query.roles = toObjectId(
                filters.role
            );
        }

        if (filters.ids?.length) {
            query._id = {
                $in: filters.ids.map(toObjectId)
            };
        }

        if (filters.name) {
            query.name = filters.name;
        }

        const result = await User
            .exists(query)
            .exec();

        return result !== null;
    }
}