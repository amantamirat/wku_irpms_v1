import mongoose from "mongoose";
import { Role, IRole } from "./role.model";
import { CreateRoleDto, UpdateRoleDto } from "./role.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { toObjectId } from "../../../common/utils/mongoose.utils";
import { IPermission } from "../permission.model";

export type PopulatedRole = Omit<IRole, "permissions"> & {
    permissions: IPermission[];
};

export interface IRoleRepository {

    findById(
        id: string,
        options?: FilterOptions
    ): Promise<IRole | null>;

    findByIds(
        ids: string[],
        options?: FilterOptions
    ): Promise<IRole[] | PopulatedRole[]>;

    findAll(): Promise<Partial<IRole>[]>;

    findDefaults(): Promise<Partial<IRole>[]>;

    findByName(
        roleName: string,
        options?: FilterOptions
    ): Promise<IRole | null>;

    create(data: CreateRoleDto): Promise<IRole>;

    update(
        id: string,
        data: UpdateRoleDto["data"]
    ): Promise<IRole | null>;

    delete(id: string): Promise<IRole | null>;
}

export class RoleRepository implements IRoleRepository {

    async findByName(roleName: string, options?: FilterOptions): Promise<IRole | null> {
        const query = Role.findOne({ name: roleName });
        if (options?.populate) {
            query.populate("permissions");
        }
        return query.lean<IRole>();
    }

    async findById(id: string, options?: FilterOptions) {
        const query = Role.findById(toObjectId(id))
        if (options?.populate) {
            query.populate("permissions");
        }
        return query.lean<IRole>();
    }

    async findByIds(
        ids: string[],
        options?: FilterOptions
    ): Promise<IRole[] | PopulatedRole[]> {

        const query = Role.find({
            _id: {
                $in: ids.map(toObjectId)
            }
        });

        if (options?.populate) {
            query.populate("permissions");
        }

        return query
            .lean<IRole[]>()
            .exec();
    }

    async create(dto: CreateRoleDto) {
        const data: Partial<IRole> = {
            name: dto.name,
            permissions: dto.permissions?.map(id => new mongoose.Types.ObjectId(id)) ?? [],
            isDefault: !!dto.isDefault
        };
        return Role.create(data);
    }

    async findAll() {
        const filter: any = {};
        return Role.find(filter)
            //.populate("permissions")
            .lean<IRole[]>()
            .exec();
    }

    async findDefaults() {
        return Role.find({ isDefault: true })
            .lean<IRole[]>()
            .exec();
    }

    async update(id: string, dtoData: UpdateRoleDto["data"]) {
        const toUpdate: any = {};

        if (dtoData.name) {
            toUpdate.name = dtoData.name;
        }

        if (dtoData.permissions) {
            toUpdate.permissions = dtoData.permissions.map(p => new mongoose.Types.ObjectId(p));
        }

        if (dtoData.isDefault !== undefined) {
            toUpdate.isDefault = dtoData.isDefault;
        }

        return Role.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IRole>();
    }

    async delete(id: string) {
        return Role.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
