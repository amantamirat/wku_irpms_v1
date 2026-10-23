import mongoose from "mongoose";
import User, {
    Accessibility,
    Gender,
    IUser,
    UserScope
} from "./user.model";

import {
    FilterUsersDTO,
    UpdateRolesDTO,
    UpdateUserDTO
} from "./user.dto";

import { FilterOptions } from "../../common/dtos/filter.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { toObjectId } from "../../common/utils/mongoose.utils";


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

export type UserByPermission = Pick<IUser, "name" | "workspace" | "gender" | "roles"> & {
    _id: mongoose.Types.ObjectId;
};


export interface IUserRepository {

    // READ
    findById(id: string, options?: FilterOptions): Promise<IUser | null>;
    findOne(filter: FilterUsersDTO): Promise<IUser | null>;
    find(filter: FilterUsersDTO, options?: FilterOptions): Promise<IUser[]>;
    findDeleted(filter: FilterUsersDTO, options?: FilterOptions): Promise<IUser[]>;
    findIdsByFilter(filter: Record<string, unknown>): Promise<mongoose.Types.ObjectId[]>;
    findByPermission(permission: string, filter?: FilterUsersDTO): Promise<UserByPermission[]>;

    // CREATE
    create(data: CreateUserData): Promise<IUser>;

    // UPDATE
    update(id: string, data: UpdateUserDTO["data"], updatedBy?: string): Promise<IUser | null>;
    updateRoles(id: string, dto: UpdateRolesDTO, updatedBy?: string): Promise<IUser | null>;
    updateScope(id: string, scope: string[] | "*" | null, updatedBy?: string): Promise<IUser>;

    // DELETE / RESTORE
    softDelete(id: string, deletedBy?: string): Promise<IUser | null>;
    restore(id: string, restoredBy?: string): Promise<IUser | null>;

    // EXISTS
    exists(filter: FilterUsersDTO): Promise<boolean>;
}


type BuildFilterOptions = {
    /** true → only soft-deleted users, false → only active users (default) */
    deleted?: boolean;
    /** true → hide system users */
    excludeSystem?: boolean;
};

const PLAIN_UPDATE_FIELDS = [
    "name",
    "birthDate",
    "gender",
    "fin",
    "orcid",
    "accessibility"
] as const;


export class UserRepository implements IUserRepository {

    // =========================
    // PRIVATE HELPERS
    // =========================

    /** Single place that turns a FilterUsersDTO into a Mongo query. */
    private buildFilter(
        filter: FilterUsersDTO = {} as FilterUsersDTO,
        { deleted = false, excludeSystem = false }: BuildFilterOptions = {}
    ): Record<string, unknown> {

        const query: Record<string, unknown> = {
            deletedAt: deleted ? { $ne: null } : null
        };

        if (excludeSystem) query.isSystem = { $ne: true };
        if (filter.workspace) query.workspace = toObjectId(filter.workspace);
        if (filter.ids?.length) query._id = { $in: filter.ids.map(toObjectId) };
        if (filter.name) query.name = filter.name;
        if (filter.specialization) query.specializations = toObjectId(filter.specialization);
        if (filter.role) query.roles = toObjectId(filter.role);

        return query;
    }

    /** updatedAt + optional updatedBy, merged into every $set. */
    private audit(by?: string): Record<string, unknown> {
        return {
            updatedAt: new Date(),
            ...(by && { updatedBy: toObjectId(by) })
        };
    }

    /** Shared findOneAndUpdate used by all single-document mutations. */
    private mutate(
        filter: Record<string, unknown>,
        set: Record<string, unknown>,
        by?: string
    ): Promise<IUser | null> {
        return User.findOneAndUpdate(
            filter,
            { $set: { ...set, ...this.audit(by) } },
            { new: true }
        )
            .lean<IUser>()
            .exec();
    }


    // =========================
    // READ
    // =========================

    async findById(id: string, options?: FilterOptions): Promise<IUser | null> {
        const query = User.findOne({ _id: toObjectId(id), deletedAt: null });

        if (options?.populate) query.populate("workspace");

        return query.lean<IUser>().exec();
    }

    async findOne(filter: FilterUsersDTO): Promise<IUser | null> {
        return User.findOne(this.buildFilter(filter))
            .lean<IUser>()
            .exec();
    }

    async find(filter: FilterUsersDTO, options?: FilterOptions): Promise<IUser[]> {
        const query = User.find(this.buildFilter(filter, { excludeSystem: true }));

        if (options?.populate) query.populate("workspace");

        return query.lean<IUser[]>().exec();
    }

    async findDeleted(filter: FilterUsersDTO, options?: FilterOptions): Promise<IUser[]> {
        const query = User.find(this.buildFilter(filter, { deleted: true }));

        if (options?.populate) query.populate("workspace");

        return query.lean<IUser[]>().exec();
    }

    async findIdsByFilter(
        filter: Record<string, unknown>
    ): Promise<mongoose.Types.ObjectId[]> {
        const users = await User.find(filter)
            .select("_id")
            .lean<{ _id: mongoose.Types.ObjectId }[]>()
            .exec();

        return users.map(u => u._id);
    }

    /**
     * Active, non-system users that have the given permission through any of their roles.
     * Optional filter (workspace, role, ...) narrows the users BEFORE the lookups run.
     */
    async findByPermission(
        permission: string,
        filter: FilterUsersDTO = {} as FilterUsersDTO
    ): Promise<UserByPermission[]> {

        return User.aggregate<UserByPermission>([

            // 1. Narrow users first so lookups only run on relevant docs
            { $match: this.buildFilter(filter, { excludeSystem: true }) },

            // 2. User -> Roles (only roles that contain the permission)
            {
                $lookup: {
                    from: "roles",
                    let: { roleIds: "$roles" },
                    pipeline: [
                        { $match: { $expr: { $in: ["$_id", "$$roleIds"] } } },
                        {
                            $lookup: {
                                from: "permissions",
                                localField: "permissions",
                                foreignField: "_id",
                                as: "perms"
                            }
                        },
                        { $match: { "perms.name": permission } },
                        { $limit: 1 },
                        { $project: { _id: 1 } }
                    ],
                    as: "matchedRoles"
                }
            },

            // 3. Keep users with at least one matching role
            { $match: { "matchedRoles.0": { $exists: true } } },

            // 4. Return only the required fields
            {
                $project: {
                    name: 1,
                    //workspace: 1,
                    gender: 1,
                    //roles: 1
                }
            }
        ]).exec();
    }


    // =========================
    // CREATE
    // =========================

    async create(data: CreateUserData): Promise<IUser> {
        return User.create(data);
    }


    // =========================
    // UPDATE
    // =========================

    async update(
        id: string,
        dto: UpdateUserDTO["data"],
        updatedBy?: string
    ): Promise<IUser | null> {

        const set: Record<string, unknown> = {};

        for (const field of PLAIN_UPDATE_FIELDS) {
            if (dto[field] !== undefined) set[field] = dto[field];
        }

        if (dto.workspace !== undefined) {
            set.workspace = dto.workspace ? toObjectId(dto.workspace) : null;
        }

        if (dto.specializations !== undefined) {
            set.specializations = dto.specializations.map(toObjectId);
        }

        return this.mutate(this.buildFilterById(id), set, updatedBy);
    }

    async updateRoles(
        id: string,
        dto: UpdateRolesDTO,
        updatedBy?: string
    ): Promise<IUser | null> {
        return this.mutate(
            this.buildFilterById(id),
            { roles: dto.roles.map(toObjectId) },
            updatedBy
        );
    }

    async updateScope(
        id: string,
        scope: string[] | "*" | null,
        updatedBy?: string
    ): Promise<IUser> {

        const user = await this.mutate(this.buildFilterById(id), { scope }, updatedBy);

        if (!user) throw new AppError(ERROR_CODES.USER_NOT_FOUND);

        return user;
    }


    // =========================
    // DELETE / RESTORE
    // =========================

    async softDelete(id: string, deletedBy?: string): Promise<IUser | null> {
        return this.mutate(
            this.buildFilterById(id),
            {
                deletedAt: new Date(),
                deletedBy: deletedBy ? toObjectId(deletedBy) : null
            },
            deletedBy
        );
    }

    async restore(id: string, restoredBy?: string): Promise<IUser | null> {
        return this.mutate(
            { _id: toObjectId(id), deletedAt: { $ne: null } },
            { deletedAt: null, deletedBy: null },
            restoredBy
        );
    }


    // =========================
    // EXISTS
    // =========================

    async exists(filter: FilterUsersDTO): Promise<boolean> {
        const result = await User.exists(this.buildFilter(filter)).exec();
        return result !== null;
    }


    // =========================
    // PRIVATE (id filter)
    // =========================

    private buildFilterById(id: string): Record<string, unknown> {
        return { _id: toObjectId(id), deletedAt: null };
    }
}