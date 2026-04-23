import User, { IUser, IOwnership } from "./user.model";
import { CreateUserDTO, UpdateUserDTO, GetUsersDTO, UpdateRolesDTO, ExistsUserDTO } from "./user.dto";
import mongoose from "mongoose";

export interface IUserRepository {
    findById(id: string): Promise<IUser | null>;
    findAll(filter?: GetUsersDTO): Promise<IUser[]>;
    create(data: CreateUserDTO): Promise<IUser>;
    update(id: string, data: UpdateUserDTO["data"]): Promise<IUser | null>;
    // Roles management
    updateRoles(userId: string, dto: UpdateRolesDTO): Promise<IUser | null>;
    // ownership management
    updateOwnerships(id: string, ownerships: IOwnership[]): Promise<IUser | null>;
    exists(filters: ExistsUserDTO): Promise<boolean>;
    delete(id: string): Promise<IUser | null>;
}


export class UserRepository implements IUserRepository {
    // -------------------------
    // FIND BY ID
    // -------------------------

    async findById(id: string, populate?: boolean): Promise<IUser | null> {
        if (populate === true) {
            return User.findById(id).
                populate("workspace").
                populate({
                    path: "roles",
                    populate: {
                        path: "permissions"
                    }
                }).
                populate("ownerships").
                lean<IUser>().
                exec();
        }
        return User.findById(new mongoose.Types.ObjectId(id))
            .lean<IUser>()
            .exec();
    }

    // -------------------------
    // FIND ALL WITH OPTIONAL FILTER
    // -------------------------
    async findAll(filter: GetUsersDTO): Promise<IUser[]> {
        const query: any = {};
        if (filter.workspace) {
            query.workspace = new mongoose.Types.ObjectId(filter.workspace);
        }
        let dbQuery = User.find(query);
        if (filter.populate) {
            dbQuery = dbQuery
                .populate("workspace")
            //.populate("specializations")
        }
        return dbQuery.
            lean<IUser[]>()
            .exec();
    }
    // -------------------------
    // CREATE
    // -------------------------
    async create(dto: CreateUserDTO): Promise<IUser> {
        const data: Partial<IUser> = {
            workspace: dto.workspace ? new mongoose.Types.ObjectId(dto.workspace) : undefined,
            name: dto.name,
            birthDate: dto.birthDate,
            gender: dto.gender,
            fin: dto.fin,
            orcid: dto.orcid,
            // Map roles to ObjectIds
            roles: dto.roles?.map(role => new mongoose.Types.ObjectId(role)),
            // Map specializations to ObjectIds
            specializations: dto.specializations?.map(spec => new mongoose.Types.ObjectId(spec)),
            // Ensure accessibility is at least an empty array
            accessibility: dto.accessibility ?? [],
            // Map the DTO "ownerships" to the Schema "ownership" field
            ownerships: dto.ownerships ?? []
        };

        return User.create(data);
    }
    // -------------------------
    // UPDATE
    // -------------------------
    async update(id: string, dtoData: UpdateUserDTO["data"]): Promise<IUser | null> {
        const toUpdate: any = {};

        if (dtoData.workspace) toUpdate.workspace = new mongoose.Types.ObjectId(dtoData.workspace);
        if (dtoData.name) toUpdate.name = dtoData.name;
        if (dtoData.birthDate) toUpdate.birth_date = dtoData.birthDate;
        if (dtoData.gender) toUpdate.gender = dtoData.gender;
        if (dtoData.fin) toUpdate.fin = dtoData.fin;
        if (dtoData.orcid) toUpdate.orcid = dtoData.orcid;
        if (dtoData.accessibility) toUpdate.accessibility = dtoData.accessibility;
        if (dtoData.specializations) {
            toUpdate.specializations = dtoData.specializations?.map(id => new mongoose.Types.ObjectId(id))
        }
        return User.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IUser>();

    }
    // -------------------------
    // ROLES UPDATE
    // -------------------------
    async updateRoles(id: string, dto: UpdateRolesDTO): Promise<IUser | null> {
        return User.findByIdAndUpdate(
            id,
            { $set: { roles: dto.roles.map(id => new mongoose.Types.ObjectId(id)), updatedAt: new Date() } },
            { new: true }
        ).lean<IUser>();
    }
    // -------------------------
    // OWNERSHIP UPDATE
    // -------------------------
    async updateOwnerships(id: string, ownerships: IOwnership[]) {
        return User.findByIdAndUpdate(
            id,
            { ownerships },
            { new: true }
        );
    }

    async exists(filters: ExistsUserDTO): Promise<boolean> {
        const query: any = {};
        if (filters.workspace) {
            query.workspace = new mongoose.Types.ObjectId(filters.workspace);
        }
        if (filters.specialization) {
            query.specializations = new mongoose.Types.ObjectId(filters.specialization);
            // This automatically checks if the array contains the ObjectId
        }
        if (filters.role) {
            query.roles = new mongoose.Types.ObjectId(filters.role);
        }
        const result = await User.exists(query).exec();
        return result !== null;
    }
    // -------------------------
    // DELETE
    // -------------------------
    async delete(id: string): Promise<IUser | null> {
        return User.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

